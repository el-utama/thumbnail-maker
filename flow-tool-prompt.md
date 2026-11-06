# Thumbnail Lab — Google Flow custom tool

Dokumen ini berisi prompt siap-tempel untuk membuat **Thumbnail Lab** di Google Flow
(flow.google.com → buka project → **Tools → Create Tool**), plus prompt iterasi dan
checklist QA.

Prinsipnya satu: **gambar dibuat model, teks dirender kode.** Kalau model yang menulis
teks, hasilnya sering salah eja dan tidak konsisten. Tool Flow bertugas menghasilkan
background/hero yang sudah menyisakan ruang untuk teks; tipografi final tetap di app lokal
(`index.html`).

---

## 0. Sebelum mulai

- Custom Tool butuh langganan Google AI Plus / Pro / Ultra.
- Setiap gambar yang dihasilkan tool memakai kredit Flow. Cek sisa kredit dulu.
- Ada kuota harian untuk membuat/mengedit tool — jangan spam Generate.
- Buat project bernama **Thumbnail Lab**, supaya hasil generate tersimpan rapi.

---

## 1. Master prompt (tempel di Create Tool)

> Build a custom tool called **Thumbnail Lab** for a YouTube music channel
> (Indonesian gamelan mixed with lo-fi, hip-hop, jazz). The tool must produce
> **high-CTR YouTube thumbnails at 1280×720**, with one clean focal subject and
> crisp, code-rendered typography.
>
> **Layout:** three columns.
> - Left: controls.
> - Center: live 16:9 preview at 1280×720 (scaled to fit), plus a 120 px-wide
>   "mobile rail" preview underneath.
> - Right: style presets, palette swatches, CTR checks, export buttons.
>
> **Controls (left):**
> 1. Video topic (textarea).
> 2. Hook — max 5 words, used as the big title. Support `|` as a manual line break.
> 3. Accent word — one word from the hook to highlight.
> 4. Kicker — one short line above or below the title.
> 5. Genre chip (e.g. "Indie Folk"), duration badge (e.g. "1 Hour"), channel name
>    (default "eL Utama").
> 6. Visual style: Night Drive, Rainy Window, Gold City, Bold Pop, Studio Mono, Reaction.
> 7. Palette: Cinematic, Midnight Gold, Rainy Cozy, Bold Pop, Studio Mono.
> 8. Subject: optional photo upload (drag & drop) OR generate a subject.
> 9. If generating: expression (curious, confident, calm, surprised) and a free-text
>    scene description that is auto-suggested from the topic.
> 10. Toggle: auto text side (keeps type on the calmer, darker half of the image).
>
> **Image generation rules (critical):**
> - Use the image model (Nano Banana Pro, 16:9, highest quality available).
> - Generate only the **background / hero image**, never the typography.
> - The image prompt must always end with:
>   "No text, no letters, no words, no typography, no logo, no watermark, no UI,
>    no captions, no signage."
> - Leave a clean, dark, low-detail area for type: left 50–55% for left-aligned
>   styles, bottom third for centered styles, and never place important detail in
>   the bottom-right corner.
> - Dramatic rim light, shallow depth of field, subtle film grain, high micro-contrast,
>   cinematic color grade. Subject off-center, looking toward the text area.
> - If a reference photo is uploaded, preserve the person's identity and pose, keep a
>   clean cut-out at chest height, and relight them to match the scene.
> - Generate **3 background variants** per request.
>
> **Typography (must be HTML/CSS over the image, not part of the generated image):**
> - Fonts: Anton (condensed caps), Bebas Neue, Archivo Black, Playfair Display
>   (700 + 900 italic), Cormorant Garamond 700, Inter Tight 900, Space Grotesk 700,
>   Great Vibes (script accent).
> - Title sizes as a percentage of canvas height: Night Drive 15.5%, Rainy 10.4%,
>   Gold City 10.2%, Bold Pop 11.8%, Studio 9.4%, Reaction 12.5%.
> - Line height 0.92–1.1, uppercase for all styles except Rainy.
> - Accent word: solid accent color, a filled highlight block (Bold Pop), or a larger
>   script font (Rainy). Never color the whole title.
> - Add a scrim (linear or radial gradient in the palette's dark tone), a vignette,
>   a soft drop shadow, and a 4–6% grain overlay so type and photo share the same light.
> - Place the genre chip + channel at the top-left and the duration badge at the
>   top-right. Keep the bottom-right 24% × 16% of the canvas empty for YouTube's
>   duration stamp.
>
> **Palettes (exact hex):**
> - Cinematic: bg #0a2a33 → #3a1a0a, accent #ff9a4d, text #fff6ea, sub #ffd9b8.
> - Midnight Gold: bg #0b0803 → #2a1c07, accent #e8c26a, text #f7e9c6, gold gradient
>   #fbeec2 / #e2b968 / #9a6f27.
> - Rainy Cozy: bg #123037 → #4a2a33, accent #f3a9b8, text #f8f0e6, sub #e2cdbd.
> - Bold Pop: bg #08080a → #151517, accent #ffd400, text #ffffff, block text #0a0a0a.
> - Studio Mono: bg #101012 → #1c1c20, accent #ff4d4d, text #f5f5f2, sub #b9b9b4.
>
> **CTR checks panel (live, recompute on every edit):**
> - Contrast ratio between title color and the pixels behind it — pass at ≥ 4.5:1;
>   offer a one-click "raise scrim" fix.
> - Hook word count — green ≤ 4, amber at 5.
> - Mobile legibility: cap height at a 120 px-wide preview — green ≥ 6 px.
> - Duration-zone overlap: red if title or badge enters the bottom-right 24% × 16%.
> - Type coverage: warn above 45% of the canvas.
>
> **Export:**
> - Render the preview to a 1280×720 canvas and download PNG (and JPG at 92%).
> - "Download A/B/C" exports the same layout in three palettes (Cinematic, Midnight
>   Gold, Bold Pop) as a zip.
> - Filename: `slug(hook)-style-palette.png`.
> - If canvas export of HTML overlays is not supported in the sandbox, say so clearly,
>   keep the 1280×720 art download, and show a copyable "design spec" (font, size,
>   position, colors) so the local compositor can finish the job.
>
> **Quality bar:** a 2–4 word hook that is readable at 120 px wide, one obvious focal
> point, type sitting in real negative space (not on top of faces or busy detail), and
> a palette that looks like one graded photograph rather than a sticker on a photo.

---

## 2. Prompt iterasi (pakai tombol Edit)

Tool hasil Flow hampir selalu perlu 3–5 putaran. Kirim **satu perbaikan per putaran**,
jangan menumpuk.

1. > The image model must never draw text. Remove all typography from the generated
   > image and render the title only as a CSS layer on top.
2. > The title is overlapping the subject's face. Move the type to the calmest third
   > and add a gradient scrim behind it.
3. > Add a 120 px-wide live preview next to the 1280×720 preview so I can check
   > readability at mobile size.
4. > Add a "Fix contrast" button that raises the scrim by 15% when the ratio is
   > under 4.5:1.
5. > Export must produce an actual 1280×720 PNG. If the CSS overlay cannot be captured,
   > tell me exactly which part fails and fall back to a clean art-only download.
6. > Persist the last hook, kicker, chip, badge and channel between sessions.

---

## 3. Prompt background per gaya

Tempel ke kolom scene description, atau jadikan default per style. Selalu akhiri
dengan klausa larangan teks.

**Night Drive**
> Cinematic night photograph from inside a car, rain on the windshield, dashboard glow,
> amber and teal city bokeh outside, subject silhouetted on the right third, the left
> half dark and calm with soft falloff, shallow depth of field, film grain, 16:9.
> No text, no letters, no words, no typography, no logo, no watermark, no UI, no captions.

**Rainy Window**
> Cozy rainy window at dusk, two ceramic mugs and a worn book on a wooden sill, warm
> lamp light on the right, rain streaks and blurred branches outside, soft teal and
> blush palette, calm empty area on the left for type, 16:9.
> No text, no letters, no words, no typography, no logo, no watermark, no UI, no captions.

**Gold City**
> Golden-hour city skyline seen through a circular architectural frame, warm haze,
> symmetrical composition, subject small in the lower third with the sky open above,
> premium editorial photography, 16:9.
> No text, no letters, no words, no typography, no logo, no watermark, no UI, no captions.

**Bold Pop**
> Studio portrait against a deep black seamless backdrop, hard yellow gel rim light,
> bold graphic shadows, subject on the right looking into the camera, clean empty
> black space on the left, 16:9.
> No text, no letters, no words, no typography, no logo, no watermark, no UI, no captions.

**Studio Mono**
> Minimal still life on a matte charcoal surface, one object, soft directional window
> light, long quiet shadow, lots of negative space, editorial product photography, 16:9.
> No text, no letters, no words, no typography, no logo, no watermark, no UI, no captions.

**Reaction**
> Close-up expressive portrait, eyes to camera, dramatic side light, dark background,
> clean empty space in the lower right, high micro-contrast, 16:9.
> No text, no letters, no words, no typography, no logo, no watermark, no UI, no captions.

**Dengan foto upload** — tambahkan:
> Use the uploaded person as the subject. Preserve identity, face shape and hairstyle.
> Change only the expression to [curious / confident / calm / surprised]. Relight with
> the scene's key light, cut out at chest height.

---

## 4. Checklist QA sebelum dipakai

- [ ] Judul dieja benar; tidak ada huruf yang dirender model gambar.
- [ ] 2–4 kata; kata aksen terbaca dalam sekali lihat.
- [ ] Pada lebar 120 px, hook masih bisa dibaca.
- [ ] Wajah/subjek tidak tertutup teks; teks berada di area negatif.
- [ ] Kontras ≥ 4.5:1 di area teks.
- [ ] Sudut kanan-bawah bersih (stamp durasi YouTube).
- [ ] Chip genre, badge, dan nama channel sejajar dan konsisten antar video.
- [ ] Warna teks diambil dari palet gambar, bukan warna acak.
- [ ] Export 1280×720, ukuran file < 2 MB.

---

## 5. Kalau Flow tidak bisa export overlay teks

Itu kemungkinan besar terjadi: sandbox tool mungkin tidak mengizinkan capture HTML ke
canvas. Jangan buang waktunya. Pakai Flow untuk **art-only** (tetap 3 varian per topik),
lalu:

1. Unduh hasil 16:9.
2. Buka `http://localhost:5177` (app lokal).
3. Drag gambar ke panel **Artwork**.
4. Pilih template + palet, isi hook, export.

App lokal merender tipografi dengan canvas, jadi teks dijamin tajam dan konsisten
dengan yang sudah diuji di sini.
