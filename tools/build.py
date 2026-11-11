"""Builds the site's pictures and js/data.js.

    uv run --with pillow tools/build.py                      # data.js only
    uv run --with pillow tools/build.py --src ~/scratch/gusta-research   # pictures too

The originals (profile pictures, cover art) are not kept in this repo. With
--src the covers in data/catalog.json and the photos listed below are cropped,
toned and compressed into art/ and img/.
"""
import argparse, json, pathlib, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
ap = argparse.ArgumentParser()
ap.add_argument("--src", help="folder holding the original pictures")
args = ap.parse_args()

catalog = json.loads((ROOT / "data" / "catalog.json").read_text())

# Acid yellow from the "U And I" and "Alive" covers, over night black.
ACID = (228, 226, 3)
NIGHT = (7, 7, 8)


def save(im, path, q=80):
    path.parent.mkdir(exist_ok=True)
    im.convert("RGB").save(path, "JPEG", quality=q, optimize=True, progressive=True)
    print(f"{path.relative_to(ROOT)}  {im.width}x{im.height}  {path.stat().st_size // 1024} KB")


def frac_crop(im, box):
    """Crop by fractions of the picture: (left, top, right, bottom)."""
    w, h = im.size
    return im.crop((round(box[0] * w), round(box[1] * h), round(box[2] * w), round(box[3] * h)))


def fit_w(im, width):
    from PIL import Image
    if im.width == width:
        return im
    return im.resize((width, round(im.height * width / im.width)), Image.LANCZOS)


def lit(im, colour=ACID, gamma=1.25, floor=0.0):
    """Light a picture in one colour: black stays black, the lightest parts
    become the colour. The look of a room lit by one coloured lamp."""
    from PIL import Image, ImageOps
    g = ImageOps.autocontrast(ImageOps.grayscale(im), cutoff=(1, 1))
    lut = []
    for ch in range(3):
        lut += [round(NIGHT[ch] + (colour[ch] - NIGHT[ch]) * max(floor, (i / 255) ** gamma)) for i in range(256)]
    return Image.merge("RGB", (g, g, g)).point(lut)


if args.src:
    from PIL import Image, ImageFilter
    SRC = pathlib.Path(args.src).expanduser()

    def op(name):
        return Image.open(SRC / name).convert("RGB")

    # --- cover art: one square per release
    for r in catalog:
        im = op(r["src"])
        side = min(im.size)
        im = im.crop(((im.width - side) // 2, (im.height - side) // 2, (im.width + side) // 2, (im.height + side) // 2))
        save(fit_w(im, min(side, 720)), ROOT / "art" / f"{r['id']}.jpg", 80)

    # --- landing: the gas station picture (his SoundCloud picture). It is a
    # small original, so it is enlarged softly rather than sharpened.
    gas = op("img/sc_avatar.jpg")
    save(fit_w(gas, 1920).filter(ImageFilter.GaussianBlur(0.6)), ROOT / "img" / "hero.jpg", 76)
    save(fit_w(frac_crop(gas, (0.26, 0.0, 0.86, 1.0)), 1080).filter(ImageFilter.GaussianBlur(0.6)), ROOT / "img" / "hero-m.jpg", 76)

    # --- about: his press portrait, lit acid yellow; and a close crop of it
    por = op("img/linktree_pic.png")
    save(fit_w(lit(frac_crop(por, (0.10, 0.0, 0.90, 1.0))), 900), ROOT / "img" / "portrait.jpg", 80)
    save(fit_w(lit(frac_crop(por, (0.16, 0.36, 0.94, 0.80))), 1600), ROOT / "img" / "portrait-close.jpg", 76)

    # --- more of him: behind the decks, the fairground, the car
    booth = op("img_ig/igc_DcUNAcij1Nj_02.jpg")
    save(fit_w(booth, 1600), ROOT / "img" / "booth.jpg", 74)
    # the contact screen's backdrop: the same picture out of focus, black and white
    from PIL import ImageOps, ImageEnhance
    soft = ImageOps.grayscale(fit_w(booth, 900)).filter(ImageFilter.GaussianBlur(11))
    save(ImageEnhance.Brightness(ImageEnhance.Contrast(soft).enhance(1.25)).enhance(0.85), ROOT / "img" / "contact.jpg", 70)
    save(fit_w(frac_crop(booth, (0.0, 0.0, 0.62, 1.0)), 900), ROOT / "img" / "booth-m.jpg", 76)
    save(fit_w(op("img/sp_avatar.jpg"), 800), ROOT / "img" / "fair.jpg", 78)
    save(fit_w(op("img/sp_gallery.jpg"), 800), ROOT / "img" / "car.jpg", 78)
    save(fit_w(frac_crop(op("img_ig/igc_DdkSF2iHIdE_01.jpg"), (0.02, 0.0, 0.98, 1.0)), 900), ROOT / "img" / "polaroid.jpg", 78)

    # --- featured records: a close crop of each cover, used very large
    closes = {
        "falling-for-you": ("img_ig/igc_DeRagIqAlrL_02.jpg", (0.00, 0.455, 0.54, 0.835)),
        "alive": ("img_ig/igc_DcOyB0wGl4V_02.jpg", (0.00, 0.645, 0.56, 0.895)),
        "holding-you-back": ("img/scart_holding-you-back.jpg", (0.035, 0.335, 0.545, 0.675)),
        "i-know-u-hate-me": ("img/scart_i-know-u-hate-me.jpg", (0.00, 0.50, 0.32, 0.72)),
    }
    dim = {"alive": 0.78}     # so the light title reads on it
    for rid, (name, box) in closes.items():
        im = fit_w(frac_crop(op(name), box), 1500)
        if rid in dim:
            im = ImageEnhance.Brightness(im).enhance(dim[rid])
        save(im, ROOT / "img" / f"close-{rid}.jpg", 74)

    # --- film grain: one small tile of noise, laid over the whole page
    import random
    random.seed(7)
    g = Image.new("LA", (220, 220))
    g.putdata([(255, random.randint(0, 36)) if random.random() < 0.5 else (0, random.randint(0, 36)) for _ in range(220 * 220)])
    g.save(ROOT / "img" / "grain.png", optimize=True)
    print("img/grain.png", (ROOT / "img" / "grain.png").stat().st_size // 1024, "KB")

    # --- link preview picture
    share = fit_w(gas, 1200)
    share = share.crop((0, (share.height - 630) // 2, 1200, (share.height - 630) // 2 + 630))
    save(share, ROOT / "img" / "share.jpg", 80)

# --- js/data.js
rows = []
for r in catalog:
    rows.append({
        "id": r["id"], "title": r["title"], "by": r["by"], "date": r["date"], "label": r["label"],
        "kind": r["kind"], "seconds": r["seconds"], "art": f"art/{r['id']}.jpg",
        "soundcloud": r["sc"], "spotify": f"https://open.spotify.com/album/{r['sp']}" if r["sp"] else "",
        # False where SoundCloud will not play the track inside another site (a label setting): Play opens SoundCloud
        "embed": r.get("embed", True),
    })
vault = json.loads((ROOT / "data" / "vault.json").read_text())
out = "// Generated by tools/build.py from data/catalog.json and data/vault.json. Do not edit by hand.\nwindow.GUSTA = " + json.dumps({"records": rows, "vault": vault}, indent=1, ensure_ascii=False) + ";\n"
(ROOT / "js" / "data.js").write_text(out)
print("js/data.js", len(rows), "records")
missing = [r["id"] for r in catalog if not (ROOT / "art" / f"{r['id']}.jpg").exists()]
if missing:
    print("no cover art for:", ", ".join(missing), file=sys.stderr)
