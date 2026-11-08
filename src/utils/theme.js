// Bản sắc "Sen" — chép từ app/theme/tokens.ts của app thật: rail teal-ink tối,
// nền giấy ấm, nhấn màu mơ. Teal là thương hiệu, mơ cho trạng thái active/CTA.
export const sen = {
  rail: '#0F2E2A',
  railActive: '#173C37',
  railText: '#C4D3CE',
  railTextDim: '#7F948E',
  canvas: '#FAF8F3',
  surface: '#FFFFFF',
  brand: '#11705F',
  brandSoft: '#E2EFEB',
  accent: '#E8896B',
  accentDeep: '#D4674A',
  ink: '#1E2A28',
  muted: '#6B7A76',
  faint: '#9AA8A3',
  hairline: '#ECE8E0',
};

export const BRAND_FONT = 'var(--sen-brand-font)';

export const surface = {
  card: '#ffffff',
  border: '#EAECEF',
  ink: '#1F2430',
  muted: '#6B7280',
};

// Màu chữ số tiền: đã đủ / còn nợ.
export const text = {
  success: '#1D9E75',
  danger: '#D85A30',
};

export const statusPalette = {
  available: { bg: '#EAF3DE', fg: '#173404', border: '#C0DD97' },
  inhouse: { bg: '#E6F1FB', fg: '#042C53', border: '#85B7EB' },
  arriving: { bg: '#FAEEDA', fg: '#412402', border: '#FAC775' },
  dirty: { bg: '#FCEBEB', fg: '#501313', border: '#F09595' },
  neutral: { bg: '#F1EFE8', fg: '#2C2C2A', border: '#D3D1C7' },
};

export const antdTheme = {
  token: {
    colorPrimary: sen.brand,
    colorLink: sen.brand,
    colorLinkHover: sen.accentDeep,
    borderRadius: 8,
    fontSize: 14,
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    colorBgLayout: sen.canvas,
  },
  components: {
    Layout: {
      headerBg: sen.surface,
      siderBg: sen.rail,
      bodyBg: sen.canvas,
      headerHeight: 56,
      headerPadding: '0',
      triggerBg: sen.railActive,
      triggerColor: sen.railText,
      // Sider theme="light" đọc bộ token light* — thiếu thì nút thu gọn rail ra nền trắng.
      lightSiderBg: sen.rail,
      lightTriggerBg: sen.railActive,
      lightTriggerColor: sen.railText,
    },
    Menu: {
      darkItemBg: 'transparent',
      darkSubMenuItemBg: 'transparent',
      darkItemColor: sen.railText,
      darkItemHoverColor: '#FFFFFF',
      darkItemHoverBg: 'rgba(255,255,255,0.06)',
      darkItemSelectedBg: sen.railActive,
      darkItemSelectedColor: sen.accent,
      itemBorderRadius: 8,
      itemHeight: 40,
      itemMarginInline: 10,
      fontSize: 13,
    },
    Table: {
      headerBg: '#FAF8F3',
      borderColor: sen.hairline,
      headerSplitColor: 'transparent',
    },
  },
};
