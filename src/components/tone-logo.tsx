// The Tone mark as an inline component. Uses currentColor so it adapts to
// whatever text color it sits in (sidebar, header, footer). The waveform
// bars are true cut-outs, so any background shows through.
// Source of truth: brand/generate.js — keep in sync if the mark changes.

export function ToneMark({
  size = 20,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 1024 1024"
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <g transform="translate(0,-38)" fill="currentColor">
        <path
          fillRule="evenodd"
          d="M512,190 H512 A160,160 0 0 1 672,350 V480 A160,160 0 0 1 512,640 H512 A160,160 0 0 1 352,480 V350 A160,160 0 0 1 512,190 Z M374,330 H374 A15,15 0 0 1 389,345 V485 A15,15 0 0 1 374,500 H374 A15,15 0 0 1 359,485 V345 A15,15 0 0 1 374,330 Z M420,260 H420 A15,15 0 0 1 435,275 V545 A15,15 0 0 1 420,560 H420 A15,15 0 0 1 405,545 V275 A15,15 0 0 1 420,260 Z M466,300 H466 A15,15 0 0 1 481,315 V595 A15,15 0 0 1 466,610 H466 A15,15 0 0 1 451,595 V315 A15,15 0 0 1 466,300 Z M512,230 H512 A15,15 0 0 1 527,245 V525 A15,15 0 0 1 512,540 H512 A15,15 0 0 1 497,525 V245 A15,15 0 0 1 512,230 Z M558,290 H558 A15,15 0 0 1 573,305 V605 A15,15 0 0 1 558,620 H558 A15,15 0 0 1 543,605 V305 A15,15 0 0 1 558,290 Z M604,250 H604 A15,15 0 0 1 619,265 V545 A15,15 0 0 1 604,560 H604 A15,15 0 0 1 589,545 V265 A15,15 0 0 1 604,250 Z M650,320 H650 A15,15 0 0 1 665,335 V495 A15,15 0 0 1 650,510 H650 A15,15 0 0 1 635,495 V335 A15,15 0 0 1 650,320 Z"
        />
        <path
          fill="none"
          stroke="currentColor"
          strokeWidth="44"
          strokeLinecap="round"
          d="M292,500 A220,220 0 0 0 732,500"
        />
        <path d="M502,730 H522 A8,8 0 0 1 530,738 V862 A8,8 0 0 1 522,870 H502 A8,8 0 0 1 494,862 V738 A8,8 0 0 1 502,730 Z M412,870 H612 A10,10 0 0 1 622,880 V900 A10,10 0 0 1 612,910 H412 A10,10 0 0 1 402,900 V880 A10,10 0 0 1 412,870 Z" />
      </g>
    </svg>
  );
}
