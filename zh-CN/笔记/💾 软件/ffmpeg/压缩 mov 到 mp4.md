---
tags:
  - 软件
  - 工具
  - ffmpeg
  - 音视频
  - 命令行
categories:
  - 软件工具
titleTemplate: ':title | 知在'
---
# 压缩 `.mov` 到 `.mp4`

```shell
ffmpeg -i {in-video}.mov -vcodec h264 -acodec aac {out-video}.mp4
```

![ffmpeg mov to mp4](./assets/Pasted%20image%2020240731163214.png)

## 参考资料

- [macos - convert .mov video to .mp4 with ffmpeg - Super User](https://superuser.com/questions/1155186/convert-mov-video-to-mp4-with-ffmpeg)
