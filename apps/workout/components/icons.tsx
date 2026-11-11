/** 운동 화면의 선 아이콘. 크기·색은 부모 `.ib svg` / `.chev svg` 스타일이 정한다 (stroke=currentColor). */
const Svg = ({ children }: { children: React.ReactNode }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    {children}
  </svg>
);

export const IconPlus = () => (
  <Svg>
    <path d="M12 5v14M5 12h14" />
  </Svg>
);
export const IconCheck = () => (
  <Svg>
    <path d="M5 12.5l4.5 4.5L19 7" />
  </Svg>
);
export const IconUndo = () => (
  <Svg>
    <path d="M9 14L4 9l5-5" />
    <path d="M4 9h10a6 6 0 010 12h-3" />
  </Svg>
);
export const IconTrash = () => (
  <Svg>
    <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />
  </Svg>
);
export const IconLock = () => (
  <Svg>
    <rect x="5" y="11" width="14" height="10" rx="2" />
    <path d="M8 11V7a4 4 0 018 0v4" />
  </Svg>
);
export const IconChevron = () => (
  <Svg>
    <path d="M6 9l6 6 6-6" />
  </Svg>
);
