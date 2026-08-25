from collections import deque
from pathlib import Path

from PIL import Image, ImageFilter, ImageOps


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT.parents[1] / "tmp" / "foxian-threeview-contact.jpg"
OUTPUT = ROOT / "assets"

# These panels are the original three-view line drawings from the user's
# portfolio contact sheet.  Crops stay inside each white source panel so the
# black filename labels from the contact sheet never enter the alpha mask.
PANELS = {
    "side": (901, 1, 1218, 305),
    "front": (59, 343, 369, 651),
    # The white back-view panel begins at x=480. The earlier crop started in
    # the contact sheet's black gutter, which became a false vertical stroke.
    "back": (480, 1, 788, 305),
}

PLATES = {
    "side": OUTPUT / "foxian-3d-side-plate-v2.png",
    "front": OUTPUT / "foxian-3d-front-plate-v2.png",
    "back": OUTPUT / "foxian-3d-back-plate-v2.png",
}


def extract_panel(source: Image.Image, box: tuple[int, int, int, int]) -> Image.Image:
    panel = source.crop(box).convert("RGB")
    gray = ImageOps.grayscale(panel)

    # Preserve the original ink structure while removing the paper.  The
    # soft threshold retains hairline strokes and suppresses JPEG paper noise.
    inverted = ImageOps.invert(gray)
    alpha = inverted.point(
        lambda value: 0 if value < 18 else min(255, round((value - 14) * 2.35))
    )
    alpha = alpha.filter(ImageFilter.GaussianBlur(0.22))
    # The source contact sheet gives each preview a thin rectangular keyline.
    # It is presentation furniture rather than character artwork, so remove
    # only those edge strips before finding the subject bounds.
    alpha.paste(0, (0, 0, 18, alpha.height))
    alpha.paste(0, (alpha.width - 18, 0, alpha.width, alpha.height))
    alpha.paste(0, (0, alpha.height - 18, alpha.width, alpha.height))

    bbox = alpha.getbbox()
    if bbox is None:
        raise RuntimeError(f"No line art found inside crop {box}")

    padding = 8
    left = max(0, bbox[0] - padding)
    top = max(0, bbox[1] - padding)
    right = min(panel.width, bbox[2] + padding)
    bottom = min(panel.height, bbox[3] + padding)
    alpha = alpha.crop((left, top, right, bottom))

    # A shared transparent canvas keeps every view at one optical scale and
    # prevents ribbons from colliding when the website uses three equal cells.
    canvas = Image.new("RGBA", (760, 900), (0, 0, 0, 0))
    max_width, max_height = 650, 805
    scale = min(max_width / alpha.width, max_height / alpha.height)
    resized = alpha.resize(
        (max(1, round(alpha.width * scale)), max(1, round(alpha.height * scale))),
        Image.Resampling.LANCZOS,
    ).filter(ImageFilter.UnsharpMask(radius=0.7, percent=85, threshold=3))
    ink = Image.new("RGBA", resized.size, (42, 40, 37, 0))
    ink.putalpha(resized)
    x = (canvas.width - ink.width) // 2
    y = canvas.height - ink.height - 28
    canvas.alpha_composite(ink, (x, y))
    return canvas


def remove_white_plate(source: Image.Image) -> Image.Image:
    """Key the verified complete 3D turnarounds off their white plate."""
    rgb = source.convert("RGB")
    alpha = Image.new("L", rgb.size)
    src = rgb.load()
    dst = alpha.load()
    for y in range(rgb.height):
        for x in range(rgb.width):
            r, g, b = src[x, y]
            low = min(r, g, b)
            chroma = max(r, g, b) - low
            # Warm studio whites are not numerically pure white.  Fold both
            # luminance and colour separation into the key so the off-white
            # plate disappears while the peach skin, wool ribbons and gold
            # details retain their antialiased edge colour.
            distance = (255 - low) + chroma * 1.2
            if distance <= 24:
                value = 0
            elif distance >= 64:
                value = 255
            else:
                value = round((distance - 24) / 40 * 255)

            # The source plates include a neutral floor sweep along the
            # bottom.  It is not part of the character and would otherwise
            # reveal the old rectangular image boundary on the paper panel.
            if y >= round(rgb.height * 0.80) and chroma < 28 and low > 120:
                floor_alpha = round(max(0, min(1, (170 - low) / 50)) * 255)
                value = min(value, floor_alpha)
            dst[x, y] = value

    # A soft luminance ramp retains fur and ribbon antialiasing without
    # leaving the rectangular white plate visible on the website.
    alpha = alpha.filter(ImageFilter.GaussianBlur(0.28))
    # Remove isolated compression flecks left in the studio background.
    # Earrings and bells are much larger than this threshold, so detached
    # accessories remain while single-pixel dust disappears.
    pixels = alpha.load()
    width, height = alpha.size
    visited = bytearray(width * height)
    for sy in range(height):
        for sx in range(width):
            start = sy * width + sx
            if visited[start] or pixels[sx, sy] <= 8:
                continue
            queue = deque([(sx, sy)])
            visited[start] = 1
            component = []
            while queue:
                x, y = queue.popleft()
                component.append((x, y))
                for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
                    if nx < 0 or ny < 0 or nx >= width or ny >= height:
                        continue
                    index = ny * width + nx
                    if visited[index] or pixels[nx, ny] <= 8:
                        continue
                    visited[index] = 1
                    queue.append((nx, ny))
            if len(component) < 120:
                for x, y in component:
                    pixels[x, y] = 0
    bbox = alpha.getbbox()
    if bbox is None:
        raise RuntimeError("No 3D subject found on white plate")
    padding = 10
    box = (
        max(0, bbox[0] - padding),
        max(0, bbox[1] - padding),
        min(rgb.width, bbox[2] + padding),
        min(rgb.height, bbox[3] + padding),
    )
    rgba = rgb.convert("RGBA").crop(box)
    rgba.putalpha(alpha.crop(box))

    canvas = Image.new("RGBA", (760, 900), (0, 0, 0, 0))
    max_width, max_height = 700, 820
    scale = min(max_width / rgba.width, max_height / rgba.height)
    resized = rgba.resize(
        (max(1, round(rgba.width * scale)), max(1, round(rgba.height * scale))),
        Image.Resampling.LANCZOS,
    )
    x = (canvas.width - resized.width) // 2
    y = canvas.height - resized.height - 24
    canvas.alpha_composite(resized, (x, y))
    return canvas


def main() -> None:
    if not SOURCE.exists():
        raise FileNotFoundError(SOURCE)
    OUTPUT.mkdir(parents=True, exist_ok=True)
    with Image.open(SOURCE) as source:
        source = source.convert("RGB")
        for view, box in PANELS.items():
            image = extract_panel(source, box)
            target = OUTPUT / f"foxian-portfolio-line-{view}.png"
            image.save(target, optimize=True)
            print(f"wrote {target.name}: {image.width}x{image.height}")

    for view, plate in PLATES.items():
        if not plate.exists():
            raise FileNotFoundError(plate)
        with Image.open(plate) as source:
            image = remove_white_plate(source)
        target = OUTPUT / f"foxian-3d-complete-{view}.png"
        image.save(target, optimize=True)
        print(f"wrote {target.name}: {image.width}x{image.height}")


if __name__ == "__main__":
    main()
