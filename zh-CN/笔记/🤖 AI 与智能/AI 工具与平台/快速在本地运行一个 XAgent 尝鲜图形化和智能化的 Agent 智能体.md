---
tags:
  - AI
  - 人工智能
  - AI Agent
  - 自主 Agent
categories:
  - AI 人工智能
title: 快速在本地运行一个 XAgent 尝鲜图形化和智能化的 Agent 智能体
---
# 快速在本地运行一个 XAgent 尝鲜图形化和智能化的 Agent 智能体

```shell
git clone beingknowing.git:OpenBMB/XAgent.git
```

```shell
cd XAgent
```

```shell
docker compose up
```

## 问题排查

```shell
Error response from daemon: Conflict. The container name "/buildx_buildkit_baize-builder0" is already in use by container "5610430c126ebc4527bd2582233c892e2356dc53b50d77def8fedeb9dd973d21". You have to remove (or rename) that container to be able to reuse that name.
```

重新再跑一下 `docker compose up` 就好了

```shell
python run.py --task "some tasks" --model "gpt-4" --config_file "assets/config.yml"
Traceback (most recent call last):
  File "run.py", line 5, in <module>
    from XAgent.config import CONFIG,ARGS
  File "XAgent/config.py", line 12
    raise AttributeError(f"'DotDict' object has no attribute '{key}'")
                                                                    ^
SyntaxError: invalid syntax
```

```shell
python3 run.py --task "some tasks" --model "gpt-4" --config_file "assets/config.yml"
Traceback (most recent call last):
  File "XAgent/run.py", line 5, in <module>
    from XAgent.config import CONFIG,ARGS
  File "XAgent/config.py", line 55
    match model_name.lower():
          ^
SyntaxError: invalid syntax
```

```shell
python run.py --task "some tasks" --model "gpt-4" --config_file "assets/config.yml"
Traceback (most recent call last):
  File "run.py", line 5, in <module>
    from XAgent.config import CONFIG,ARGS
  File "XAgent/config.py", line 2, in <module>
    import yaml
ModuleNotFoundError: No module named 'yaml'
```

<Citation type="转载" source="Nólëbase" url="https://nolebase.ayaka.io/zh-CN/%E7%AC%94%E8%AE%B0/%F0%9F%A4%96%20AI%20%E4%BA%BA%E5%B7%A5%E6%99%BA%E8%83%BD/%E5%BF%AB%E9%80%9F%E5%9C%A8%E6%9C%AC%E5%9C%B0%E8%BF%90%E8%A1%8C%E4%B8%80%E4%B8%AA%20XAgent%20%E5%B0%9D%E9%B2%9C%E5%9B%BE%E5%BD%A2%E5%8C%96%E5%92%8C%E6%99%BA%E8%83%BD%E5%8C%96%E7%9A%84%20Agent%20%E6%99%BA%E8%83%BD%E4%BD%93.html" />
