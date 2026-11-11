# Gusta: artist site (preview)

A work-in-progress artist site for Gusta (New York DJ and producer), laid out
after [inherited.band](https://inherited.band/): a full-screen photo with the
name spread across it, then one screen per subject built from a very large
close crop, a smaller card, a two-line title and three short lines, tiny
capitals in the four corners, film grain, and a contact screen with one big
address that copies on click.

Live preview: https://samsegan.github.io/gusta-site/

The page carries a `noindex` tag and a "Preview build, not yet official" line
until Gusta signs off on it.

## Colours

Taken from Gusta's own pictures and cover art instead of the reference's red:

| Colour | Where it comes from |
|---|---|
| Night black `#070708` | his flash-at-night profile pictures |
| Bone `#ece5d3` | flash-lit whites (the balaclava, the white tee) |
| Acid yellow `#e4e203` | the "U And I" and "Alive" covers; his portrait is lit in it |
| Orange `#f08c45` | "Falling For You" lettering |
| Baby blue `#9cc4f5` | "Holding You Back" lettering |
| Rose `#cfa898` | "I Know U Hate Me" skin tones |

Each featured record's screen takes its colour from its own cover.

## What is on the page

1. **Landing**: his gas-station picture, the name, city and sound, the latest single.
2. **About**: who he is in three lines and one paragraph.
3. **Four records**, one screen each: Falling For You, Alive, Holding You Back,
   I Know U Hate Me.
4. **Every record**: all 29 singles and SoundCloud uploads, newest first, plus
   the unreleased IDs he has named. On a computer the songs play in the page
   through SoundCloud's own player; on phones Play opens SoundCloud.
5. **Live**: sets he has played, and how to book him.
6. **Contact**: management address, copies on click.

## Files

Plain HTML, CSS and JavaScript. No framework, no build step for the page.

| File | What it holds |
|---|---|
| `index.html` | Every section and all the wording |
| `css/styles.css` | The look |
| `js/app.js` | Letters, scroll motion, the record list, contact screen, player |
| `js/data.js` | Generated: the records (do not edit by hand) |
| `data/catalog.json` | The discography, one row per record |
| `data/vault.json` | Unreleased songs he has named |
| `art/`, `img/`, `fonts/` | Cover art, photos, the typeface (Familjen Grotesk) |

## Changing things

**A new record:** add a row at the top of `data/catalog.json` (`sc` is the
SoundCloud link, `sp` the Spotify album id, `src` the cover file inside the
originals folder), then:

    uv run --with pillow tools/build.py --src <folder with the originals>

Add `"embed": false` to a row when SoundCloud will not play that track inside
other sites (a label setting; "Alive" is one): Play then opens SoundCloud
instead of the page's own player.

Without `--src` only `js/data.js` is rewritten. The originals (profile
pictures, full-size covers) are not kept in this repo.

**Wording, contact, links, sets played:** straight in `index.html`.

## Where the facts come from

- Records, dates and labels: his SoundCloud and Spotify pages. A label is shown
  only where Spotify names one.
- "New York", the management address, the links: his SoundCloud and Instagram
  profiles and his link page.
- Sets played and the unreleased songs: his own Instagram posts and the posts
  of the venues and stations (Elsewhere, Clubhouse FM, Studio B).
- Photos: his profile pictures and posts. They need his OK before the site is
  made official.

## Preview locally

    python3 -m http.server 8812

then open http://127.0.0.1:8812/.
