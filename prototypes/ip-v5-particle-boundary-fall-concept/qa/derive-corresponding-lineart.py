from pathlib import Path

from PIL import Image, ImageChops, ImageEnhance, ImageFilter, ImageOps


ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets"


def make_line_art(source_name: str, output_name: str) -> None:
    source = Image.open(ASSETS / source_name).convert("RGBA")

    # Work from the exact final 3D view so silhouette, pose, ribbons and ornaments
    # always correspond. These source exports have an opaque white background, so
    # derive the subject mask from colour distance rather than trusting alpha.
    white = Image.new("RGBA", source.size, (255, 255, 255, 255))
    composite = Image.alpha_composite(white, source).convert("RGB")

    red, green, blue = composite.split()
    distance = ImageChops.lighter(
        ImageChops.lighter(ImageOps.invert(red), ImageOps.invert(green)),
        ImageOps.invert(blue),
    )
    subject_mask = distance.point(lambda value: 255 if value > 7 else 0)
    subject_mask = subject_mask.filter(ImageFilter.MaxFilter(5)).filter(ImageFilter.GaussianBlur(0.7))

    # Blur before quantising: the broad colour masses still describe the exact
    # construction while the knitted micro-texture disappears from the trace.
    softened = composite.filter(ImageFilter.GaussianBlur(4.2))
    poster = softened.quantize(colors=9, dither=Image.Dither.NONE).convert("RGB")
    gray = ImageOps.grayscale(poster)
    structural = gray.filter(ImageFilter.GaussianBlur(1.45))
    edges = structural.filter(ImageFilter.FIND_EDGES)
    edges = ImageOps.autocontrast(edges, cutoff=2)
    edges = ImageEnhance.Contrast(edges).enhance(1.35)
    edges = edges.point(lambda value: 0 if value < 44 else min(255, int((value - 44) * 2.25)))
    edges = edges.filter(ImageFilter.MaxFilter(3)).filter(ImageFilter.GaussianBlur(0.42))

    # Add a precise outer contour from the same 3D silhouette.
    expanded = subject_mask.filter(ImageFilter.MaxFilter(7))
    contracted = subject_mask.filter(ImageFilter.MinFilter(7))
    silhouette = ImageChops.subtract(expanded, contracted)
    silhouette = silhouette.filter(ImageFilter.GaussianBlur(0.45))
    line_alpha = ImageChops.lighter(edges, silhouette)
    line_alpha = ImageChops.multiply(line_alpha, expanded)

    # A very faint wash keeps the view readable without turning it back into a
    # grayscale render. The darker layer is the actual technical trace.
    wash_alpha = subject_mask.point(lambda value: int(value * 0.038))
    wash = Image.new("RGBA", source.size, (67, 62, 56, 0))
    wash.putalpha(wash_alpha)
    ink = Image.new("RGBA", source.size, (47, 45, 42, 0))
    ink.putalpha(line_alpha.point(lambda value: int(value * 0.9)))
    result = Image.alpha_composite(wash, ink)
    result.save(ASSETS / output_name, optimize=True)


for view in ("side", "front", "back"):
    make_line_art(f"foxian-clean-{view}.png", f"foxian-line-{view}.png")
