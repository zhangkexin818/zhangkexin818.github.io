from collections import deque
from pathlib import Path

from PIL import Image, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "assets" / "foxian-3d-triple-white-v4.png"
OUTPUTS = ("side", "front", "back")


def subject_alpha(image: Image.Image) -> Image.Image:
    """Remove the neutral studio background and retain the largest figure."""
    rgb = image.convert("RGB")
    width, height = rgb.size
    pixels = rgb.load()

    foreground = bytearray(width * height)
    for y in range(height):
        row = y * width
        for x in range(width):
            r, g, b = pixels[x, y]
            light = min(r, g, b) >= 235
            neutral = max(r, g, b) - min(r, g, b) <= 18
            if not (light and neutral):
                foreground[row + x] = 1

    visited = bytearray(width * height)
    largest: list[int] = []
    for start in range(width * height):
        if not foreground[start] or visited[start]:
            continue
        visited[start] = 1
        queue: deque[int] = deque([start])
        component: list[int] = []
        while queue:
            current = queue.popleft()
            component.append(current)
            x = current % width
            y = current // width
            if x:
                neighbor = current - 1
                if foreground[neighbor] and not visited[neighbor]:
                    visited[neighbor] = 1
                    queue.append(neighbor)
            if x + 1 < width:
                neighbor = current + 1
                if foreground[neighbor] and not visited[neighbor]:
                    visited[neighbor] = 1
                    queue.append(neighbor)
            if y:
                neighbor = current - width
                if foreground[neighbor] and not visited[neighbor]:
                    visited[neighbor] = 1
                    queue.append(neighbor)
            if y + 1 < height:
                neighbor = current + width
                if foreground[neighbor] and not visited[neighbor]:
                    visited[neighbor] = 1
                    queue.append(neighbor)
        if len(component) > len(largest):
            largest = component

    alpha_data = bytearray(width * height)
    for index in largest:
        alpha_data[index] = 255
    alpha = Image.frombytes("L", (width, height), bytes(alpha_data))
    return alpha.filter(ImageFilter.GaussianBlur(0.55))


def main() -> None:
    source = Image.open(SOURCE).convert("RGBA")
    panel_width = source.width // 3

    for index, name in enumerate(OUTPUTS):
        left = index * panel_width
        right = source.width if index == 2 else (index + 1) * panel_width
        panel = source.crop((left, 0, right, source.height))
        panel.putalpha(subject_alpha(panel))

        bbox = panel.getchannel("A").getbbox()
        if not bbox:
            raise RuntimeError(f"No foreground found for {name}")
        pad = 8
        crop = (
            max(0, bbox[0] - pad),
            max(0, bbox[1] - pad),
            min(panel.width, bbox[2] + pad),
            min(panel.height, bbox[3] + pad),
        )
        output = panel.crop(crop)
        target = ROOT / "assets" / f"foxian-clean-{name}.png"
        output.save(target, optimize=True)
        print(name, output.size, target.name)


if __name__ == "__main__":
    main()
