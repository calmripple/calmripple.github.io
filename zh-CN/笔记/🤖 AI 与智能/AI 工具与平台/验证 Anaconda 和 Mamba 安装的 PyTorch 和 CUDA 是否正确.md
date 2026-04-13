---
tags:
  - AI
  - 人工智能
  - PyTorch
  - Anaconda
  - Python
categories:
  - AI 人工智能
title: 验证 Anaconda 和 Mamba 安装的 PyTorch 和 CUDA 是否正确
---
# 验证 Anaconda 和 Mamba 安装的 PyTorch 和 CUDA 是否正确

参考安装清单：

```yaml
channels:
  - pytorch
  - nvidia
  - conda-forge
dependencies:
  - pytorch
  - torchvision
  - torchaudio
  - pytorch-cuda=12.1
  - cuda-nvcc
```

## 检查 PyTorch

启动 `python`

```shell
python
```

```shell
>>> import torch
>>> torch.version.cuda
'12.1'
>>> torch.backends.cudnn.version()
8902
>>> torch.cuda.is_available()
True
```

或者撰写 Python 脚本和 Notebook：

```python
import sys
import torch

print(sys.prefix)
print(torch.version.cuda)
print(torch.backends.cudnn.version())
print(torch.__version__)
print(torch.cuda.is_available())
```

## 检查 NVCC

运行 `nvcc` 命令检查是否正确安装 CUDA 编译器

```shell
nvcc --version
```

```shell
nvcc --version
nvcc: NVIDIA (R) Cuda compiler driver
Copyright (c) 2005-2021 NVIDIA Corporation
Built on Fri_Dec_17_18:16:03_PST_2021
Cuda compilation tools, release 11.6, V11.6.55
Build cuda_11.6.r11.6/compiler.30794723_0
```

## 检查 PyTorch 拓展

```shell
>>> import torch.utils.cpp_extension
>>> torch.utils.cpp_extension.CUDA_HOME
```

<Citation type="转载" source="Nólëbase" url="https://nolebase.ayaka.io/zh-CN/%E7%AC%94%E8%AE%B0/%F0%9F%A4%96%20AI%20%E4%BA%BA%E5%B7%A5%E6%99%BA%E8%83%BD/%E9%AA%8C%E8%AF%81%20Anaconda%20%E5%92%8C%20Mamba%20%E5%AE%89%E8%A3%85%E7%9A%84%20PyTorch%20%E5%92%8C%20CUDA%20%E6%98%AF%E5%90%A6%E6%AD%A3%E7%A1%AE.html" />
