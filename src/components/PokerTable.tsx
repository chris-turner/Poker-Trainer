import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { ALL_POSITIONS, type Card, type Position } from '../types/poker';
import { CardBack } from './CardBack';
import { PlayingCard } from './PlayingCard';

// Seat content is a CardBack (34 tall) stacked above a position badge (~22 tall) with a 4px gap.
// These are the sizes at scale 1 (see `scale` below) — the natural, width-driven table size.
const SEAT_WIDTH = 60;
const SEAT_HEIGHT = 64;
// height / width of the felt oval. MIN is the familiar flat-oval look, used whenever the
// vertical budget is tight or unknown; MAX is how round it's allowed to get when there's slack
// to grow into (a tall screen), so the table gets visibly bigger instead of leaving dead space
// below it.
const TABLE_ASPECT_MIN = 0.78;
const TABLE_ASPECT_MAX = 1.3;
// Hole card sizing: a fraction of screen width, clamped so cards don't balloon on tablets or
// vanish on tiny screens.
const CARD_WIDTH_RATIO = 0.19;
const CARD_MAX_WIDTH = 84;
const CARD_MIN_WIDTH = 56;
const CARD_ASPECT = 100 / 72;
// Fixed (not scaled) so budgeting the hero card row's footprint doesn't create a circular
// dependency on the felt's own scale.
const HERO_CARD_MARGIN = 14;

function pointOnEllipse(angleDeg: number, rx: number, ry: number, cx: number, cy: number, scale = 1) {
  const rad = (angleDeg * Math.PI) / 180;
  return {
    x: cx + rx * scale * Math.sin(rad),
    y: cy - ry * scale * Math.cos(rad),
  };
}

/**
 * Hero is always drawn at the bottom (180deg, hidden — the hero's own cards render as a
 * separate row below the felt instead of a seat). Every other seat is placed relative to
 * hero's actual position, so the ring rotates around hero the same way it does at a real
 * online poker table, rather than UTG always being "up top".
 */
function angleForPosition(position: Position, heroPosition: Position): number {
  const heroIndex = ALL_POSITIONS.indexOf(heroPosition);
  const index = ALL_POSITIONS.indexOf(position);
  const steps = (index - heroIndex + ALL_POSITIONS.length) % ALL_POSITIONS.length;
  return (180 + steps * 45) % 360;
}

/**
 * A seat's state relative to hero for shading/labeling purposes. `raiserPosition` may sit either
 * before hero (vs RFI: hero is reacting to that seat's open) or after hero (vs 3bet: hero opened
 * and that seat re-raised) — both are "the seat hero is reacting to", just on opposite sides.
 */
function seatState(
  index: number,
  heroIndex: number,
  raiserIndex: number | null
): 'raiser' | 'folded' | 'live' {
  if (raiserIndex === index) return 'raiser';
  if (raiserIndex === null) return index < heroIndex ? 'folded' : 'live';
  if (raiserIndex < heroIndex) {
    // vs RFI: the raiser opened before hero, so anyone else before hero also folded to it.
    return index < heroIndex ? 'folded' : 'live';
  }
  // vs 3bet: hero opened, so anyone before hero folded pre-open, and anyone between hero and
  // the 3-better folded to hero's raise; anyone after the 3-better hasn't acted yet.
  if (index < heroIndex) return 'folded';
  if (index > heroIndex && index < raiserIndex) return 'folded';
  return 'live';
}

/**
 * Static poker table graphic: 8 seats around a full oval rail, dealer button at BTN, blinds
 * posted at SB/BB, hero's hole cards in their own row below the felt (never on top of it, so
 * they can't cover a seat/chip). The felt is sized to fill the available width, capped by
 * `maxHeight` (its caller's height budget) while keeping a fixed aspect ratio — when the
 * height budget is what limits it, every seat/chip/badge shrinks with it via `scale` so
 * nothing overflows the smaller felt; on ordinary phone aspect ratios the width is the
 * binding constraint and scale stays at 1, leaving the table pixel-identical to before.
 */
export function PokerTable({
  heroPosition,
  heroCards,
  maxHeight,
  raiserPosition,
}: {
  heroPosition: Position;
  heroCards?: [Card, Card];
  maxHeight?: number;
  /** The seat hero is reacting to, if any (the RFI opener for vs-RFI, the 3-better for vs-3bet). */
  raiserPosition?: Position;
}) {
  const { width } = useWindowDimensions();
  const widthBasedWidth = Math.min(width - 24, 420);

  const cardWidth = Math.min(CARD_MAX_WIDTH, Math.max(CARD_MIN_WIDTH, width * CARD_WIDTH_RATIO));
  const cardHeight = cardWidth * CARD_ASPECT;
  // `maxHeight` is the budget for this whole component (felt + the hero card row beneath it),
  // so the row's fixed footprint has to come out of the budget before it's handed to the felt.
  const heroCardBlockHeight = heroCards ? HERO_CARD_MARGIN + cardHeight : 0;
  const feltMaxHeight = maxHeight != null ? Math.max(0, maxHeight - heroCardBlockHeight) : undefined;

  // Fit the felt into (widthBasedWidth, feltMaxHeight) rather than just shrinking-to-fit: when
  // there's more vertical room than the flat-oval look needs, grow into it (up to
  // TABLE_ASPECT_MAX) instead of leaving that height unused. Only fall back to shrinking the
  // width when even the flat-oval height doesn't fit the budget.
  let tableWidth: number;
  let tableHeight: number;
  const minComfortableHeight = widthBasedWidth * TABLE_ASPECT_MIN;
  if (feltMaxHeight == null || feltMaxHeight >= minComfortableHeight) {
    tableWidth = widthBasedWidth;
    tableHeight = feltMaxHeight == null ? tableWidth * TABLE_ASPECT_MIN : Math.min(feltMaxHeight, tableWidth * TABLE_ASPECT_MAX);
  } else {
    tableWidth = Math.min(widthBasedWidth, feltMaxHeight / TABLE_ASPECT_MIN);
    tableHeight = tableWidth * TABLE_ASPECT_MIN;
  }
  const scale = Math.max(0.7, tableWidth / widthBasedWidth);

  const cx = tableWidth / 2;
  const cy = tableHeight / 2;
  const seatWidth = SEAT_WIDTH * scale;
  const seatHeight = SEAT_HEIGHT * scale;
  const rx = tableWidth / 2 - seatWidth / 2 - 2;
  const ry = tableHeight / 2 - seatHeight / 2 - 2;
  const heroIndex = ALL_POSITIONS.indexOf(heroPosition);
  const raiserIndex = raiserPosition ? ALL_POSITIONS.indexOf(raiserPosition) : null;
  const badgeFontSize = Math.max(11, Math.round(12 * scale));

  return (
    <View style={styles.wrapper}>
      <View
        style={[
          styles.felt,
          {
            width: tableWidth,
            height: tableHeight,
            borderRadius: tableHeight / 2,
          },
        ]}
      >
        {ALL_POSITIONS.map((position, index) => {
          if (position === heroPosition) return null;
          const angle = angleForPosition(position, heroPosition);
          const { x, y } = pointOnEllipse(angle, rx, ry, cx, cy);
          const state = seatState(index, heroIndex, raiserIndex);
          const folded = state === 'folded';
          const isRaiser = state === 'raiser';
          return (
            <View
              key={position}
              style={[
                styles.seat,
                { left: x - seatWidth / 2, top: y - seatHeight / 2, width: seatWidth, gap: 4 * scale },
              ]}
            >
              {/* Always reserve the CardBack's footprint — folded seats just leave it empty — so
                  the badge below lands in the same spot whether or not a card back is drawn. */}
              <View style={{ transform: [{ scale }] }}>
                {folded ? <View style={styles.cardBackSlot} /> : <CardBack />}
              </View>
              <View
                style={[
                  styles.badge,
                  folded && styles.badgeFolded,
                  isRaiser && styles.badgeRaiser,
                  { paddingVertical: 3 * scale, paddingHorizontal: 10 * scale, borderRadius: 12 * scale },
                ]}
              >
                <Text style={[styles.badgeText, folded && styles.badgeTextFolded, { fontSize: badgeFontSize }]}>
                  {position}
                </Text>
              </View>
            </View>
          );
        })}

        <Chip
          label="D"
          angle={angleForPosition('BTN', heroPosition)}
          rx={rx}
          ry={ry}
          cx={cx}
          cy={cy}
          color="#f4c430"
          textColor="#3a2e00"
          scale={scale}
        />
        <Chip
          label="0.5"
          angle={angleForPosition('SB', heroPosition)}
          rx={rx}
          ry={ry}
          cx={cx}
          cy={cy}
          color="#eef1f5"
          textColor="#1a1a1a"
          scale={scale}
        />
        <Chip
          label="1"
          angle={angleForPosition('BB', heroPosition)}
          rx={rx}
          ry={ry}
          cx={cx}
          cy={cy}
          color="#eef1f5"
          textColor="#1a1a1a"
          scale={scale}
        />
      </View>

      {heroCards && (
        <View style={[styles.heroCardsRow, { marginTop: HERO_CARD_MARGIN, gap: 12 * scale }]}>
          <PlayingCard card={heroCards[0]} width={cardWidth} height={cardHeight} />
          <PlayingCard card={heroCards[1]} width={cardWidth} height={cardHeight} />
        </View>
      )}
    </View>
  );
}

function Chip({
  label,
  angle,
  rx,
  ry,
  cx,
  cy,
  color,
  textColor,
  scale,
}: {
  label: string;
  angle: number;
  rx: number;
  ry: number;
  cx: number;
  cy: number;
  color: string;
  textColor: string;
  scale: number;
}) {
  const { x, y } = pointOnEllipse(angle, rx, ry, cx, cy, 0.55);
  const size = 30 * scale;
  const fontSize = Math.max(9, Math.round(11 * scale));
  return (
    <View
      style={[
        styles.chip,
        { left: x - size / 2, top: y - size / 2, width: size, height: size, borderRadius: size / 2, backgroundColor: color },
      ]}
    >
      <Text style={[styles.chipText, { color: textColor, fontSize }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    alignItems: 'center',
  },
  felt: {
    backgroundColor: '#2fa35c',
    borderWidth: 4,
    borderColor: '#0a2b18',
  },
  seat: {
    position: 'absolute',
    alignItems: 'center',
  },
  badge: {
    backgroundColor: '#3f51b5',
  },
  badgeText: {
    color: '#fff',
    fontWeight: '700',
  },
  badgeFolded: {
    backgroundColor: '#3a4048',
  },
  // The seat hero is reacting to (RFI opener or 3-better) — called out in warm orange so it
  // reads at a glance as "the raise", distinct from the neutral indigo of a live/unacted seat.
  badgeRaiser: {
    backgroundColor: '#d9822b',
  },
  badgeTextFolded: {
    color: '#8a92a0',
  },
  // Matches CardBack's own footprint (see CardBack.tsx's `wrap` style) so swapping it for this
  // keeps the badge below at a consistent height regardless of folded state.
  cardBackSlot: {
    width: 40,
    height: 34,
  },
  chip: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#00000033',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  chipText: {
    fontWeight: '700',
  },
  heroCardsRow: {
    flexDirection: 'row',
  },
});
