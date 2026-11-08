import { BRAND_FONT, surface } from '../utils/theme';

export default function SectionCard({ title, extra, children, style }) {
  return (
    <div style={{ background: surface.card, border: `1px solid ${surface.border}`, borderRadius: 14, padding: 16, ...style }}>
      {(title || extra) && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            marginBottom: 14,
            flexWrap: 'wrap',
          }}
        >
          {title ? (
            <div style={{ fontSize: 15, fontWeight: 600, color: surface.ink, fontFamily: BRAND_FONT }}>{title}</div>
          ) : (
            <span />
          )}
          {extra ? <div>{extra}</div> : null}
        </div>
      )}
      {children}
    </div>
  );
}
