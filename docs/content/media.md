---
title: Media
description: Add images and embed videos.
---

## Images

Put images in `assets/` and reference them with an absolute path:

```md
![Alt text](/assets/images/diagram.png)
```

## Video embeds

Use an iframe:

```html
<iframe
  width="560"
  height="315"
  src="https://www.youtube.com/embed/VIDEO_ID"
  title="Video"
  frameborder="0"
  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
  allowfullscreen
></iframe>
```
