// Full-screen page loading state, drawn over the header, footer and tab bar:
// the car from the KarSouq logo draws itself in, drives off, and the
// "Buy • Sell • Drive" tagline lights up word by word. The car is
// traced from public/logo.png (800×288), so it lines up with the real logo.
// Keyframes live in app/globals.css under `.ks-loader`.

const CAR_INK = [
  // Roofline swoosh
  "M90 88C91 86.7 96.5 82.1 100 80C103.5 77.9 114.2 72.2 120 70C125.8 67.8 140.7 62.9 150 61C159.3 59.1 188.3 55 200 54C211.7 53 240.7 52.7 250 52C259.3 51.3 274.2 49.5 280 48C285.8 46.5 293 42.1 300 39C307 35.9 330.7 24.6 340 21C349.3 17.4 370.7 10.2 380 8C389.3 5.8 411.8 2.8 420 2C428.2 1.2 443 1 450 1C457 1 471.8 1.2 480 2C488.2 2.8 510.7 6.2 520 8C529.3 9.8 550.7 14.7 560 17C569.3 19.3 590.7 25.4 600 28C609.3 30.6 630.7 36.8 640 39C649.3 41.2 672.9 46 680 47C687.1 48 701 47.6 701 48C701 48.4 687.1 50.7 680 50.5C672.9 50.3 649.3 47.6 640 46C630.7 44.4 609.3 38.9 600 36.5C590.7 34.1 569.3 27.7 560 25.5C550.7 23.3 529.3 19.1 520 17.5C510.7 15.9 489.3 12.4 480 11.5C470.7 10.6 449.3 9.3 440 9.5C430.7 9.7 409.3 11.8 400 13.5C390.7 15.2 368.2 21.9 360 24.5C351.8 27.1 335.8 33.5 330 36C324.2 38.5 313.5 44.2 310 46C306.5 47.8 302.3 49 300 51C297.7 53 295.8 62 290 63.5C284.2 65 260.5 63.3 250 63.5C239.5 63.7 211.7 64.6 200 65.5C188.3 66.4 159.3 69.9 150 71.5C140.7 73.1 125.8 77.8 120 79.5C114.2 81.2 103.4 85.2 100 86.5C96.6 87.8 92.2 90.8 91 91C89.8 91.2 89 89.3 90 88Z",
  // Window
  "M296 55C300.7 54 329 55.4 340 55C351 54.6 381.2 53.2 390 52C398.8 50.8 409.2 47.2 415 45C420.8 42.8 434.2 35.6 440 33C445.8 30.4 459.2 24.3 465 23C470.8 21.7 482.4 21.4 490 22C497.6 22.6 521.8 26.4 530 28C538.2 29.6 554.6 34.4 560 36C565.4 37.6 574.8 40.7 576 42C577.2 43.3 574.2 46.6 570 47.5C565.8 48.4 548.2 48.9 540 49.5C531.8 50.1 510.5 51.7 500 52.5C489.5 53.3 461.7 55.6 450 56.5C438.3 57.4 412.8 59.6 400 60.5C387.2 61.4 351.7 63.6 340 64C328.3 64.4 305.1 65 300 64C294.9 63 291.3 56 296 55Z",
  // Rear bumper
  "M92 99C92 97.9 93.7 98 100 96C106.3 94 120 89.2 130 87C140 84.8 152.7 83.5 160 83C167.3 82.5 172.3 83.2 174 84C175.7 84.8 172.3 85.8 170 87.5C167.7 89.2 165 92.1 160 94.5C155 96.9 150 100.7 140 102C130 103.3 108 103 100 102.5C92 102 92 100.1 92 99Z",
  // Rear wheel arch
  "M177 112C178.5 109 186.2 99.2 190 95C193.8 90.8 195 89.7 200 87C205 84.3 213.3 80.5 220 79C226.7 77.5 233.3 77.2 240 78C246.7 78.8 253.3 80.7 260 84C266.7 87.3 275 93.8 280 98C285 102.2 286 104 290 109C294 114 302 124.8 304 128C306 131.2 302.7 129 302 128.5C301.3 128 302 127 300 125C298 123 293.3 119.2 290 116.5C286.7 113.8 285 111.7 280 108.5C275 105.3 266.7 100.3 260 97.5C253.3 94.7 246.7 92.5 240 91.5C233.3 90.5 226.7 90.5 220 91.5C213.3 92.5 205 95.5 200 97.5C195 99.5 193.2 100.9 190 103.5C186.8 106.1 183.2 111.6 181 113C178.8 114.4 175.5 115 177 112Z",
  // Front wheel arch
  "M499 117C500.5 114.7 506.5 107.8 510 104C513.5 100.2 516.7 97.2 520 94C523.3 90.8 526.7 87.7 530 85C533.3 82.3 536.7 80 540 78C543.3 76 546.7 74.3 550 73C553.3 71.7 556.7 70.8 560 70C563.3 69.2 566.7 68.3 570 68C573.3 67.7 576.7 67.8 580 68C583.3 68.2 586.7 68.5 590 69C593.3 69.5 596.7 70 600 71C603.3 72 606.7 73.3 610 75C613.3 76.7 616.7 78.5 620 81C623.3 83.5 626.7 86 630 90C633.3 94 637.5 100 640 105C642.5 110 643.7 114.8 645 120C646.3 125.2 647.8 133.2 648 136C648.2 138.8 646.8 138.8 646 136.5C645.2 134.2 645.7 127.2 643 122.5C640.3 117.8 633.8 112.5 630 108.5C626.2 104.5 623.3 101.2 620 98.5C616.7 95.8 613.3 94.3 610 92.5C606.7 90.7 603.3 88.8 600 87.5C596.7 86.2 593.3 85.3 590 84.5C586.7 83.7 583.3 82.8 580 82.5C576.7 82.2 573.3 82.3 570 82.5C566.7 82.7 563.3 83 560 83.5C556.7 84 553.3 84.5 550 85.5C546.7 86.5 543.3 88 540 89.5C536.7 91 533.3 92.5 530 94.5C526.7 96.5 523.3 99 520 101.5C516.7 104 513.2 106.8 510 109.5C506.8 112.2 502.8 116.8 501 118C499.2 119.2 497.5 119.3 499 117Z",
];

const CAR_GREEN = [
  // Side swoosh
  "M304 98C305.7 96.2 314 92.8 320 91C326 89.2 333.3 88.3 340 87C346.7 85.7 353.3 84 360 83C366.7 82 373.3 81.8 380 81C386.7 80.2 393.3 78.7 400 78C406.7 77.3 414 77.4 420 77C426 76.6 434.3 75.5 436 75.5C437.7 75.5 434.3 76.3 430 77C425.7 77.7 416.7 78.6 410 79.5C403.3 80.4 396.7 81.3 390 82.5C383.3 83.7 376.7 84.8 370 86.5C363.3 88.2 356.7 90.7 350 92.5C343.3 94.3 336.7 96 330 97.5C323.3 99 314.3 101.4 310 101.5C305.7 101.6 302.3 99.8 304 98Z",
  // Nose
  "M619 65C620.2 64.5 635.2 64.3 640 64C644.8 63.6 655.3 62.4 660 62C664.7 61.6 675.3 61.5 680 61C684.7 60.5 696.9 58.5 700 58C703.1 57.5 706.8 55.4 707 57C707.2 58.6 703.3 68.4 702 72C700.7 75.6 697.3 85.1 696 88C694.7 90.9 692.9 97.3 691 97C689.1 96.7 682.5 87.4 680 85.5C677.5 83.6 672.3 81.5 670 80.5C667.7 79.5 662.3 77.3 660 76.5C657.7 75.7 652.3 74.2 650 73.5C647.7 72.8 642.3 71.1 640 70.5C637.7 69.9 632.5 69.1 630 68.5C627.5 67.9 617.8 65.5 619 65Z",
];

// Speed streaks trailing the car once it "drives".
const STREAKS = [
  { y: 58, x: 30, width: 50 },
  { y: 78, x: 10, width: 70 },
  { y: 98, x: 40, width: 40 },
];

const TAGLINE = ["Buy", "Sell", "Drive"];

export function BrandLoader({ label = "Loading", className = "" }: { label?: string; className?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`ks-loader pt-safe pb-safe fixed inset-0 z-[100] flex flex-col items-center justify-center gap-5 bg-canvas px-4 dark:bg-[#0a0a0a] ${className}`}
    >
      <svg
        viewBox="0 -10 720 165"
        className="w-64 text-ink sm:w-96 dark:text-white"
        aria-hidden
        focusable="false"
      >
        <defs>
          <linearGradient id="ks-loader-green" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0" className="ks-loader-stop-a" />
            <stop offset="1" className="ks-loader-stop-b" />
          </linearGradient>
          <mask id="ks-loader-ink-mask" maskUnits="userSpaceOnUse" x="0" y="-10" width="720" height="165">
            <rect className="ks-loader-reveal" x="85" y="-10" width="630" height="165" fill="white" />
          </mask>
          <mask id="ks-loader-green-mask" maskUnits="userSpaceOnUse" x="0" y="-10" width="720" height="165">
            <rect className="ks-loader-reveal ks-loader-reveal-late" x="300" y="-10" width="415" height="165" fill="white" />
          </mask>
        </defs>

        <g className="ks-loader-streaks" stroke="currentColor" strokeLinecap="round" strokeWidth="4">
          {STREAKS.map((streak, index) => (
            <line
              key={streak.y}
              x1={streak.x}
              x2={streak.x + streak.width}
              y1={streak.y}
              y2={streak.y}
              style={{ animationDelay: `${index * 0.08}s` }}
            />
          ))}
        </g>

        <g className="ks-loader-car">
          <g mask="url(#ks-loader-ink-mask)" fill="currentColor">
            {CAR_INK.map((d) => (
              <path key={d.slice(0, 16)} d={d} />
            ))}
          </g>
          <g mask="url(#ks-loader-green-mask)" fill="url(#ks-loader-green)">
            {CAR_GREEN.map((d) => (
              <path key={d.slice(0, 16)} d={d} />
            ))}
          </g>
        </g>

        <line
          className="ks-loader-road"
          x1="60"
          x2="720"
          y1="148"
          y2="148"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray="28 22"
        />
      </svg>

      <p className="flex items-center gap-3 text-caption font-medium tracking-[0.3em] uppercase" aria-hidden>
        {TAGLINE.map((word, index) => (
          <span key={word} className="flex items-center gap-3">
            {index > 0 && <span className="size-1.5 rounded-full bg-brand-600" />}
            <span className="ks-loader-word" style={{ animationDelay: `${index * 0.8}s` }}>
              {word}
            </span>
          </span>
        ))}
      </p>
      <span className="sr-only">{label}…</span>
    </div>
  );
}
