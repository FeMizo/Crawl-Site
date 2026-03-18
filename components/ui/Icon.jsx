const ICONS = {
  dashboard: (
    <path
      d="M3.5 4.5h7v6h-7zm10 0h7v9h-7zm-10 9h7v7h-7zm10 3h7v4h-7z"
      fill="currentColor"
    />
  ),
  projects: (
    <>
      <path d="M3.5 7.5h7l1.5 2h8.5v9h-17z" fill="currentColor" opacity=".92" />
      <path d="M3.5 6.5a2 2 0 0 1 2-2h4l1.3 1.7h9.7v2H3.5z" fill="currentColor" opacity=".45" />
    </>
  ),
  history: (
    <>
      <circle cx="12" cy="12" r="8.2" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 7.4v5.2l3.6 2.2" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </>
  ),
  settings: (
    <path
      d="M10.7 2.6h2.6l.5 2.2c.5.2 1 .4 1.5.7l2-1 1.9 1.9-1 2c.3.5.5 1 .7 1.5l2.2.5v2.6l-2.2.5c-.2.5-.4 1-.7 1.5l1 2-1.9 1.9-2-1c-.5.3-1 .5-1.5.7l-.5 2.2h-2.6l-.5-2.2c-.5-.2-1-.4-1.5-.7l-2 1-1.9-1.9 1-2a7.4 7.4 0 0 1-.7-1.5l-2.2-.5v-2.6l2.2-.5c.2-.5.4-1 .7-1.5l-1-2 1.9-1.9 2 1c.5-.3 1-.5 1.5-.7zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6"
      fill="currentColor"
    />
  ),
  login: (
    <>
      <path d="M12.5 4.5h7v15h-7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M4.5 12h10.5m-3.2-3.3L15 12l-3.2 3.3" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  register: (
    <>
      <circle cx="9" cy="8.2" r="3.2" fill="currentColor" opacity=".92" />
      <path d="M3.8 18.5c.7-3 3-4.8 5.2-4.8s4.5 1.8 5.2 4.8" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M17 8.5h4m-2-2v4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8.3" r="3.6" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M5.3 19c1.2-3.2 3.8-5.1 6.7-5.1S17.5 15.8 18.7 19" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </>
  ),
  users: (
    <>
      <circle cx="8" cy="9" r="2.8" fill="currentColor" opacity=".9" />
      <circle cx="16.5" cy="8.2" r="2.3" fill="currentColor" opacity=".6" />
      <path d="M3.7 18.4c.8-2.8 3-4.4 5.3-4.4s4.5 1.6 5.3 4.4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M13.6 17.4c.5-1.9 2-3.1 3.8-3.1 1.5 0 2.8.8 3.6 2.4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </>
  ),
  plus: (
    <path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  ),
  trash: (
    <>
      <path d="M5.5 7h13m-10.8 0 .7 11h7.2l.7-11M9.5 7V5.2h5V7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  edit: (
    <>
      <path d="M5 19l3.8-.8L19 8l-3.2-3.2L5.7 15z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M13.8 6.8l3.2 3.2" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </>
  ),
  external: (
    <>
      <path d="M13 5h6v6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M19 5 9 15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M11 7H6a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2v-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </>
  ),
  database: (
    <>
      <ellipse cx="12" cy="6" rx="7" ry="2.8" fill="currentColor" opacity=".92" />
      <path d="M5 6v8c0 1.5 3.1 2.8 7 2.8s7-1.3 7-2.8V6" fill="none" stroke="currentColor" strokeWidth="1.6" />
    </>
  ),
  shield: (
    <path
      d="M12 3.5 5.5 6v4.7c0 4.2 2.6 7.1 6.5 9.3 3.9-2.2 6.5-5.1 6.5-9.3V6z"
      fill="currentColor"
      opacity=".9"
    />
  ),
  eye: (
    <>
      <path
        d="M2.8 12s3.4-5.4 9.2-5.4 9.2 5.4 9.2 5.4-3.4 5.4-9.2 5.4S2.8 12 2.8 12Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="2.7" fill="none" stroke="currentColor" strokeWidth="1.8" />
    </>
  ),
  eyeOff: (
    <>
      <path
        d="M3.2 4.2 20.8 19.8"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M9.9 6.9a9.5 9.5 0 0 1 2.1-.3c5.8 0 9.2 5.4 9.2 5.4a15.7 15.7 0 0 1-3.2 3.6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6.6 9A15 15 0 0 0 2.8 12s3.4 5.4 9.2 5.4c1 0 1.9-.1 2.7-.4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </>
  ),
  workspace: (
    <>
      <rect x="3.5" y="4.5" width="17" height="13" rx="2.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M3.5 9h17" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8 19v2m8-2v2" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </>
  ),
  run: (
    <>
      <path d="M6 5.5h12v13H6z" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M10 9.2 15 12l-5 2.8z" fill="currentColor" />
    </>
  ),
  roadmap: (
    <>
      <circle cx="6" cy="6" r="2" fill="currentColor" />
      <circle cx="18" cy="6" r="2" fill="currentColor" />
      <circle cx="18" cy="18" r="2" fill="currentColor" />
      <circle cx="6" cy="18" r="2" fill="currentColor" />
      <path
        d="M8 6h8M18 8v8M16 18H8M6 16V8"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </>
  ),
  filter: (
    <path
      d="M4 6h16l-6.3 7v5.2l-3.4 1.8V13z"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
      strokeLinecap="round"
    />
  ),
  tasks: (
    <>
      <path d="M5 6.7h2.8v2.8H5zM5 11.6h2.8v2.8H5zM5 16.5h2.8v2.8H5z" fill="currentColor" />
      <path d="M10.5 8.1h8.2M10.5 13h8.2M10.5 17.9h8.2" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </>
  ),
};

export default function Icon({ name, size = 18, className = "" }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      {ICONS[name] || ICONS.workspace}
    </svg>
  );
}
