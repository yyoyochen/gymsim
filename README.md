# GYMSIM

A pixel-art isometric strength-gym simulation built as an agent-based model. Change the layout, mix the member types, and simulate a day of use. Tap anyone to follow their workout.

**Play it in your browser: https://yyoyochen.github.io/gymsim/**

Works on desktop and phones. Use the **En / 中文** button to switch between English and Traditional Chinese.

## What it is

- Members arrive through the day, queue for racks, platforms, benches and machines, and work through their own programme of lifts.
- A control panel sets equipment counts, member mix, arrival curve, weather and the neighbourhood (urban, suburban, rural).
- Live monitors and plots show occupancy, queues, zone use and wait times.

## Build

The game is a single `index.html`. The sources are in `src/` and are joined in file-name order by `build.py`.

```
python3 build.py        # needs fonttools: pip install fonttools brotli
```

Open `index.html` in a browser to play locally.

## Credits

- Rendering: [three.js](https://threejs.org/) (MIT), loaded from a CDN.
- Chinese pixel font: [Cubic 11](https://github.com/ACh-K/Cubic-11) (free to use, copy and distribute; see `fonts/Cubic11-OFL.txt`). A subset is embedded in `index.html`.
- Latin pixel fonts: Silkscreen and Pixelify Sans (SIL Open Font License), loaded from Google Fonts.

## License

MIT. See [LICENSE](LICENSE).
