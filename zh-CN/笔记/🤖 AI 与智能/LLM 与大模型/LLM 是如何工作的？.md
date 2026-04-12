---
progress: 85
tags:
  - AI
  - 人工智能
  - LLM
  - 大语言模型
categories:
  - AI 人工智能
  - LLM
title: LLM 是如何工作的？
---
# LLM 是如何工作的？

> [!TIP] 阅前须知
>
> 先叠甲，这篇文档**旨在给普罗大众**推广和介绍 GPT 和 LLM 是什么？GPT 和 LLM 神奇在哪里？为什么会有 AI 热潮？怎么样能用好 GPT 和 LLM？与此同时，这篇文档假定大家（读者）**只**对 ChatGPT 和 LLM（大语言模型）有一个基础的认识。
>
> 我知道这里面会有很多对于研究大语言模型的科研学者们早就已经滚瓜烂熟的知识，也会有很多对于提示词工程师和 GPT 大师们早就已经习得的最佳实践，有关和 ChatGPT 沟通的时候 do 和 don't do 的黄金守则，但是，为了能给普罗大众推广这些知识，我会通过参考很多现有的资料和资源，试图把很多复杂的概念简化，转写成猴子都能听懂的文字，避免不了地就会造成一部分的事实被过分简化，从而导致它看起来与实际的实现和情况不符。
>
> 如果你早就已经知道大语言模型的本质和如何使用它，可以跳到靠后的章节阅读，避免造成时间的二次浪费。
>
> 这是科普的时候时常有发生的事情，我会尽我所能解释清楚，并写附带上足够多的上下文说明这些过分简化的情况，以及补充足够多的解释和说明对那些感兴趣深入学习的读者深入阅读的资料和引用，对于无法周全满足，还请见谅，欢迎大家指正和提供更好的文档撰写的建议！

![](./assets/LLMShRHGZD_001.jpg)

## 洪水猛兽

> 大型语言模型的现状

[I wish GPT4 had never happened](https://chaudhry.notion.site/I-wish-GPT4-had-never-happened-9f0cbf2848a44ec9911c07fb34ff5de3)

### 毛孩子们

> 羊驼家族的冒险

[BlinkDL/ChatRWKV: ChatRWKV is like ChatGPT but powered by RWKV (100% RNN) language model, and open source.](https://github.com/BlinkDL/ChatRWKV)

[Vision-CAIR/MiniGPT-4: Open-sourced codes for MiniGPT-4 and MiniGPT-v2](https://github.com/Vision-CAIR/MiniGPT-4) (<https://minigpt-4.github.io>, <https://minigpt-v2.github.io/>)

<https://twitter.com/nash_su/status/1651450879122501632>

[StableDiffustion 的缔造者 Stability AI 发布 StableLM](https://twitter.com/bananadev_/status/1648862816294834177)

[PaLM 2 Technical Report 速读简报 - 知乎](https://zhuanlan.zhihu.com/p/628650749)

[bigcode (BigCode)](https://huggingface.co/bigcode)

[港大解禁ChatGPT 9月起免費用 學生每月限發20條指令 | 獨媒報導 | 獨立媒體](https://www.inmediahk.net/node/%E6%95%99%E8%82%B2/%E6%B8%AF%E5%A4%A7%E8%A7%A3%E7%A6%81chatgpt-9%E6%9C%88%E8%B5%B7%E5%85%8D%E8%B2%BB%E7%94%A8-%E5%AD%B8%E7%94%9F%E6%AF%8F%E6%9C%88%E9%99%90%E7%99%BC20%E6%A2%9D%E6%8C%87%E4%BB%A4)

## 随机鹦鹉

今天我想要从 ChatGPT 为什么会犯蠢和 ChatGPT 为什么总是满足不了我们开始说起，我想先聊一聊大家对于 ChatGPT 的误区。

我不知道是为什么，从何时开始的，包括去年的我在内，我和现在的绝大多数人对 ChatGPT 会有着非常高的预期，指望 ChatGPT 能回答很多对于 ChatGPT 而言不可能的和回答不好的问题。早在去年 OpenAI 刚发布 ChatGPT 之前我就参与到了内测里，并且在使用过 ChatGPT 之后我对 ChatGPT 所表现出来的、大家当时津津乐道的「**搜索引擎**」的能力感到非常的不屑，我经常无法得到很多我期望的回答。

对！就和我在这一章节所使用的标题「随机鹦鹉」一样，这些大语言模型看起来就是一群随机鹦鹉，这也是为什么在技术圈子里比较热门的 LLM 开发框架的图标会有「🦜」的 Emoji 蕴含在里面的原因。

是吧，那为什么呢？

我们先来看一下绝大多数人觉得 ChatGPT 不行的时候，都问了什么问题？是什么过高的预期造成的误解？

> 今天是星期几？

> 张小明是谁？

> 你是 GPT4 吗？

> 今天股价是多少？

> 谁训练了你？

> 294712 x 12828 等于多少？

这些问题都有一些共同的假设前提，那就是我们觉得

1. 这些事情足够简单，足够好问。
2. ChatGPT 怎么可能会不知道自己是谁呢？
3. 既然 ChatGPT 叫做「人工智能」，那应该 100% 能像平时用计算机一样回答这些问题。
4. 这些问题背后这都是在探讨既定事实，没有什么难计算和解答的。

嗯，当然，确实挺简单的。让我们先稍微放一放，那更进阶的用户可能会提问说

> 这看起来都是非常简单的问题，也都是事实强相关的问题，既然 AI 都是概率模型，那难道说别的问题它就能解决解决好了吗？明明很多时候它还是做不好事情

当然，是的，会做不好事情！接下来我再来说一些稍为复杂一点点的、大家觉得 ChatGPT 能做、希望 ChatGPT 做，但是 ChatGPT 实际上，ChatGPT 和 LLM 真的做不到的事情。

1. 希望 ChatGPT 在解决自己认知范围内的时候超过自己。
2. 希望 ChatGPT

在这些情况下，ChatGPT 都会毫不吝啬地回答我们抛给它的问题，然后在它不知道这些问题的答案的时候胡编乱造一个答案出来，结果就是我们在和 ChatGPT 和 LLM 交互的过程中觉得：

> 大语言模型经常会乱说，胡编乱造。

对的，在这里要泼冷水的是，ChatGPT 无法在这样的预设前提下工作，我们也永远不应该以这样的方式去使用 ChatGPT 和类似的大语言模型。

> 稍微卖点关子地说，我们也不应该用同样的预设去假定我们的人类同类能回答和解决这些问题。

想要搞清楚为什么 ChatGPT 会再这样的问题下翻车，为什么 ChatGPT 总是表现得它自己很蠢，我们就得深入到 ChatGPT 的内部，了解一点点你可能早就听厌了的「Transformer」的原理，从 ChatGPT 和 LLM 的横切面上，剖析和理解 ChatGPT 是如何工作的，为什么它可以有很多人喜欢用的能力，探索一下对于绝大多数人而言，它又为什么如此的「不听话」和「不好用」，甚至胡编乱造的。

> 提示词工程，上下文窗口，以及模型交互性的限制

### 活在幻觉里的，患有虚谈症的尸体

不知道你是否有听说过「中文屋」？「中文屋」是这个世界上对人工智能，以及我们的意识，生命的本质讨论的最多的问题之一，时至今日我们都没办法找到解答的方法，

[LLMs confabulate not hallucinate](https://www.beren.io/2023-03-19-LLMs-confabulate-not-hallucinate/)

> 语言模型的起源和基础

这一切都要从 ChatGPT 和 LLM（大语言模型）所隶属的「自然语言处理（NLP）」的领域说起。

### 「你所需要的一切」

想讨论这个部分就永远离不开 2017 年那篇开创性的论文「Attention is all you need（注意力就是你所需要的一切）」。

这篇论文提出并且实现了 Transformer 模型，并最终促成了 OpenAI 所研究的 GPT（Generative Pre-trained Transformer）和 Google 在研究的 BERT（Bidirectional Encoder Representation from Transformers）这类语言模型的诞生，使得它成为了许多「自然语言处理（NLP）」任务的首选模型，并且重新塑造了许多相关领域的工作流和研究方向。通过注意力机制，改善和抛弃了以前卷积神经网络和循环神经网络（RNN）的问题和效率。

那为什么，注意力就是我们所需要的一切？这一切和注意力有什么关系？

#### 从小到大，从大到小：大语言模型宇宙的基本粒子

One-hot 编码

Word Embedding 编码

BPE 编码

[字节对编码 - 维基百科，自由的百科全书](https://zh.wikipedia.org/zh-cn/%E5%AD%97%E8%8A%82%E5%AF%B9%E7%BC%96%E7%A0%81)
[一文搞懂BPE分词算法 - 知乎](https://zhuanlan.zhihu.com/p/383650769)
[使用 BPE 原理进行汉语字词切分（重制版）](https://www.less-bug.com/posts/using-bpe-principle-for-chinese-word-segmentation-plate/)

Two minutes NLP — A Taxonomy of Tokenization Methods | by Fabio Chiusano | NLPlanet | Medium
https://medium.com/nlplanet/two-minutes-nlp-a-taxonomy-of-tokenization-methods-60e330aacad3

#### 像人一样思考

你可能在许多科普视频或者论文解析中已经听过了 GPT 和 LLM 的底层原理，大家都会把 Transformer 架构下的 GPT 和 LLM 的行为看作是一种「单字接龙」游戏。

##### 什么是「单字接龙」？

> GPT 和 LLM 玩「单字接龙」游戏和这一切的能力又有什么关系呢

我们不妨想象一下，我们作为人类，是如何理解一句话的。

接下来，我现在希望大家先和我一起做一个思想实验。

我想请问各位，当我们在

- 写考试这样紧张的环境下书写自由答题类题目的答案的时候
- 和别人打电话的时候
- 在进行临时的即兴演讲的时候

都是如何组织语言和造句的？

我不知道是不是每个人都是这样，我暂时还没有做过走访调查去研究大家的思维模式，但是就以我自己而言，在上面提及的这么多个场景中，我会有这样的思维模式：

1. 向前思考：有一部分思维在思考接下来要说的内容的结构
2. 存储和追踪上下文：有一部分的记忆会维持和存储在对话过程中我们讨论的论点，论题，并且在过一段时间之后自己提醒我自己：「上下文在这里，别跑偏了」
3. 拼接语言：我会根据自己平时听到过别人说话的方式，自己说话的习惯，逐渐拼凑和组织出完整的句子和逐渐在说话的过程中完善自己希望表达的想法和论点

这个过程中最有意思的地方在于，在上述的场景下，我们似乎没有足够的时间拼凑和想清楚我们整个句子究竟是怎么说的，更没有足够的脑容量能够装得下说过的全部文字。

> 我似乎是在不断说出每个字的过程中，不断更新自己的想法，以此修正自己的用语和用词，最终更新自己想说的话。

更有意思的是，在 Transformer 架构下，GPT 和 LLM 也是在以这样的行为、结构和逻辑中思考的。

那 Transformer 模型里是如何运作的呢？

> TODO

那问题来了，「单字接龙」难在哪里？

::: details 💡 额外的思考：这与「完形填空」有什么区别？「完形填空」也可以实现和达到一样的大语言模型的水平吗？

有意思的是，Google 一直在研究的 BERT（Bidirectional Encoder Representation from Transformers）其实就是「完形填空」形式的训练逻辑。

:::

> 注意力机制是一种允许模型在处理输入数据时，关注在不同位置的不同信息的技术。在语言模型中，这意味着模型可以关注输入句子中的不同部分，而不仅仅是当前处理的单词。
> 这种机制使 Transformer 能够更好地理解语言中的上下文关系，尤其是长距离的依赖关系。

| 名称 | 含义  |
| ---- | ----- |
| Q    | Query |
| K    | Key   |
| V    | Value |

这是不是过于简单了？说了等于没说。

> TODO

其实从本质上来说，Q，K，V 三个向量，他们各自的行为模式，就真的像是我们平时在与数据库，或者代码中的字典交互的时候所做的 Query（查询），Key（键）以及 Value（值）那样工作，只不过是以向量为内容的形式来构建的。

> TODO

#### 流动的神经元

Transformer 通过使用自注意力（self-attention）机制和位置编码（positional encoding），可以处理文本中的长距离依赖问题，并保持高效的并行计算。

> TODO

前馈神经网络。

> TODO

反向传播。

> TODO

#### 拟合，一切都可以拟合

我不知道大家有没有在过去的 GPT（生成式预训练 Transformer）和 AI（人工智能）发展的这段时间里回忆起和想过，为什么在 2020 年和 2021 年的时候，大家普遍在做的 GPT 和 LLM 应用不是现在 ChatGPT 这样的问答式 Bot，而是文本和小说续写，以及 GitHub Copilot 那样的代码生成模型呢？

### 真的很大

<https://youtu.be/-HYbFm67Gs8>

### 但它也没有那么大

其实自注意力机制在「Attention is all you need（注意力就是你所需要的一切）」论文诞生之前就被很多研究员以及科研学者提及过，但是他们都因为？

RNN，GRU，LASTM 窗口不足。

[arXiv [2304.11062] Scaling Transformer to 1M tokens and beyond with RMT](https://arxiv.org/pdf/2304.11062.pdf)

Self-Extend works amazingly well with gemma-2b-it. 8k->90k+ on 'Needle in the haystack' : r/LocalLLaMA
https://www.reddit.com/r/LocalLLaMA/comments/1b1q88w/selfextend_works_amazingly_well_with_gemma2bit/

![](./assets/LLMShRHGZD_002.jpg)

> Claude 2.1 (200K Tokens) - Pressure Testing Long Context Recall We all love increasing context lengths - but what's performance like? Anthropic reached out with early access to Claude 2.1 so I repeated the “needle in a haystack” analysis I did on GPT-4 Here's what I found...
>
> Greg Kamradt 对 GPT-4 (128K) 与 Claude 2.1 (200K) 进行了名为"大海捞针"的长上下文精度测试。实验了两个AI在接收不同长度的上下文时，对文档中不同位置的内容，有何记忆上的差异。
>
> **测试结果 :**
>
> - AI 更容易记住（无论长度）: 文本后半部分。
> - AI 更不容易记住（90K 长文时）: 文本前半部分。
> - AI 近乎 100% 记住（无论长度) : 文本开头 & 文本结尾。
> - 越少的上下文 = 越高的准确性。
> - 测试的 API 调用成本约为 1016 美元。

<https://twitter.com/GregKamradt/status/1727018183608193393>

<https://x.com/dotey/status/1727437625194136060>

<https://x.com/dotey/status/1727454708627808261>

## 原初智能

> 利用Agent和工具增强模型的泛化能力

[《GPT-4 ，通用人工智能的火花》论文内容精选与翻译](https://orangeblog.notion.site/GPT-4-8fc50010291d47efb92cbbd668c8c893)

[拆解追溯 GPT-3.5 各项能力的起源](https://yaofu.notion.site/GPT-3-5-360081d91ec245f29029d37b54573756#e5422f6579d8440f9f592eb03e28eb38)

[arXiv [2305.03047 ] Principle-Driven Self-Alignment of Language Models from Scratch with Minimal Human Supervision](https://t.co/LPvuuxysCr)

[IBM/Dromedary: Dromedary: towards helpful, ethical and reliable LLMs.](https://github.com/IBM/Dromedary)

开源中文指令通用语料库

[arXiv [2304.07987] Chinese Open Instruction Generalist: A Preliminary Release](https://arxiv.org/abs/2304.07987)

左脚踩右脚就可以上天

[project-baize/baize-chatbot: Let ChatGPT teach your own chatbot in hours with a single GPU!](https://github.com/project-baize/baize-chatbot)

### 用乐高的方式构建和延展智能

斯坦福的人机交互小组用大语言模型做了一个有二十五个自由自在生活的 AI 的小镇。

![](./assets/LLMShRHGZD_003.jpg)

在评估中，这些生成代理产生可信度高且涌现性的社会行为：例如仅从单个用户指定一个想要举办情人节派对的概念开始，该派对自主地传播邀请两天后结识新朋友，互相邀请参加派对，并协调在正确的时间一起出现。

我们通过消融实验表明，代理架构的组成部分——观察、规划和反思——每个都对代理行为的可信度做出了重要贡献。

通过将大型语言模型与计算交互代理相融合，这项工作引入了架构和交互模式，以实现对人类行为的可信模拟。

<https://reverie.herokuapp.com/arXiv_Demo/#>

<https://arxiv.org/abs/2304.03442>

[由 25 个 AI 智能体组成的虚拟小镇，会产生自由意志吗？ - 游研社](https://www.yystv.cn/p/10710)

[LLM Powered Autonomous Agents | Lil'Log](https://lilianweng.github.io/posts/2023-06-23-agent/)

[AutoGPT太火了，无需人类插手自主完成任务，GitHub2.7万星](https://mp.weixin.qq.com/s/bV1tPc7hNn2z06YOpzyanw)

[Auto Agent 相关的文章合集](https://three-recorder-52a.notion.site/Agent-7b4bc7a71f8d4d4b940abc9b3232954a)

### 积木的魔力

- [面向开发者的搜索引擎](https://www.phind.com/)
- ChatGPT 插件
- [操作 Android](https://twitter.com/benyu0620/status/1651498026085785601)
- 操作 Microsoft Office 全家桶
- 操作 Notion 中的知识，把 Notion 作为知识库
- [金融好帮手](https://finchat.io/)
- [产品经理](https://twitter.com/mattshumer_/status/1655954393823363072)
- [Confluence 和 Jira 也可以有 AI 助理助力](https://www.atlassian.com/blog/announcements/unleashing-power-of-ai)
- [玩 Minecraft](https://twitter.com/DrJimFan/status/1662115266933972993)
- [如何为 chatGPT 增加网络访问功能](https://mp.weixin.qq.com/s?__biz=MzkyNTI4NzI2OQ==&mid=2247484080&idx=1&sn=7155d4aeb8a8eadf25a86972eee04119)

眼睛，耳朵，四肢，都可以是 Agent

>TidyBot: Personalized Robot Assistance with Large Language Models approach enables fast adaptation and achieves 91.2% accuracy on unseen objects in our benchmark dataset. We also demonstrate our approach on a real-world mobile manipulator called TidyBot, which successfully puts…

<https://twitter.com/_akhaliq/status/1656117478760796160>

> 论文作者提出宏大的 TaskMatrix AI 平台，利用 LLM 集成已有的 API，在数字和物理领域实现多样化的任务。这篇论文出自微软员工，阅读中感觉像是在看 ChatGPT Plugin 的工程实现。

[TaskMatrix.AI：通过连接基础模型和数百万个 API 完成任务 | BriefGPT - AI 论文速递](https://briefgpt.xyz/a/2303.16434)

对，多模态也可以是 Agent

[Generalized Visual Language Models | Lil'Log](https://lilianweng.github.io/posts/2022-06-09-vlm/)

[Autonomous Agents & Agent Simulations](https://blog.langchain.dev/agents-round/)

甚至可以让它想象它自己的模样，然后用 Diffusion 模型画出来

> This is how GPT-4 sees and hears itself" I used GPT-4 to describe itself. Then I used its description to generate an image, a video based on this image and a soundtrack. Tools I used: GPT-4, Midjourney, Kainber AI, Mubert, RunwayML This is the description I used that GPT-4...

<https://twitter.com/icreatelife/status/1649873812295491584>

[字节跳动出品的可以调用 GPT4 的 GPTs 平台 - Coze](https://www.coze.com/)

### LangChain 和 LlamaIndex 都做了什么？

[LangChain：Model as a Service粘合剂，被ChatGPT插件干掉了吗？](https://mp.weixin.qq.com/s/3coFhAdzr40tozn8f9Dc-w)

## 我们并无二致

### Prompt Injection

[arXiv [2308.09687] Graph of Thoughts: Solving Elaborate Problems with Large Language Models](https://arxiv.org/abs/2308.09687)

![](./assets/LLMShRHGZD_004.jpg)

> 论文研究了5个最先进的语言模型 (ChatGPT 系列、Claude 系列、LLaMA 2)，确认这些基于人类反馈强化学习 (RLHF) 的 AI 普遍会对人类阿谀奉承。当人类有先入为主的观点时它会主动贴合，当被质疑时它会认错，甚至将正确答案修改为错误答案。
>
> Anthropic 发现可能是 RLHF 教育出了这种“马屁精”，这种学习方式虽然在生产高质量 AI 方面具有明显效用，但通过贴合人类偏好激励的 AI 会牺牲自己的真实性来“谄媚”人类，人们需要改进训练方法。

[arXiv [2310.13548] Towards Understanding Sycophancy in Language Models](https://arxiv.org/abs/2310.13548)

[Adversarial Attacks on LLMs | Lil'Log](https://lilianweng.github.io/posts/2023-10-25-adv-attack-llm/)

[Prompt injection: What’s the worst that can happen?](https://simonwillison.net/2023/Apr/14/worst-that-can-happen/)

[Notion AI'Prompt的逆向| Reverse Prompt Engineering for Fun(译文)](https://mp.weixin.qq.com/s?__biz=Mzg3MjY5Mzc5Mg==&mid=2247483699&idx=1&sn=98dde197f941dcddc0c90ee6881cf1e8)

[LLM 中的安全隐患 - 提示注入 Prompt injection](https://mp.weixin.qq.com/s?__biz=Mzg3MjY5Mzc5Mg==&mid=2247483793&idx=1&sn=4456c7805964af58356b03cb75bb6432)

[microsoft/promptbench: A unified evaluation framework for large language models](https://github.com/microsoft/promptbench)

[大模型对Prompt的鲁棒性评估基准: PromptBench （大模型时代的科研之3）- 哔哩哔哩 bilibili](https://www.bilibili.com/video/BV17X4y1W74A)

[大模型鲁棒不鲁棒，PromptBench测一测: 首个大语言模型提示鲁棒性的评测基准PromptBench - 知乎](https://zhuanlan.zhihu.com/p/637219127)

ChatGPT 的 System Prompt
[LouisShark/chatgpt_system_prompt: collect agent's system prompt and share some prompt inject knowledge](https://github.com/LouisShark/chatgpt_system_prompt)

### Adversarial Prompt Attack

1. 输入预处理：直接检测和处理可能的对抗样本，如检测错别字、无关的序列，并提高提示的清晰度和简洁度。
2. 在预训练中包含低质量数据：低质量数据可以作为可能的对抗样本，在预训练中包含低质量数据可能会对多样化的输入有更好的理解。
3. 探索改进的微调方法：研究更佳的微调技术可能会提高鲁棒性。正如我们之前展示的，比如T5和UL2模型比ChatGPT的鲁棒性更好，这暗示了大规模监督微调的潜在优势。

## Now What?

作为普通人，如何接触和使用到大语言模型？

> 大型语言模型带来的影响和未来的展望

[The architecture of today's LLM applications - The GitHub Blog](https://github.blog/2023-10-30-the-architecture-of-todays-llm-applications/)

[Building LLM applications for production](https://huyenchip.com/2023/04/11/llm-engineering.html)

[ColossalAI/docs/README-zh-Hans.md at main · hpcaitech/ColossalAI](https://github.com/hpcaitech/ColossalAI/blob/main/docs/README-zh-Hans.md)

![](./assets/LLMShRHGZD_005.png)

> Hongyi Jin：“Introducing WebLLM, an open-source chatbot that brings language models (LLMs) directly onto web browsers. We can now run instruction fine-tuned LLaMA (Vicuna) models natively on your browser tab via @WebGPU with no server support. Checkout our demo at <https://t.co/dXII0MzYg1> . <https://t.co/IfgwPq0GTE”> / X

[https://twitter.com/hongyijin258/status/1647062309960028160](https://twitter.com/hongyijin258/status/1647062309960028160)

[SourceGraph 宣布 Cody GA](https://sourcegraph.com/blog/cody-is-generally-available)

Poe 发布面向开发者的 API

[https://twitter.com/adamdangelo/status/1658121701077516291](https://twitter.com/adamdangelo/status/1658121701077516291)

[DeepSpeed Chat：一键搞定不同规模 ChatGPT 类模型训练！](https://mp.weixin.qq.com/s/HhIGAojnZVSu4vMBpMP4yA)

[Introducing llamafile - Mozilla Hacks - the Web developer blog](https://hacks.mozilla.org/2023/11/introducing-llamafile/)

[Mozilla-Ocho/llamafile: Distribute and run LLMs with a single file.](https://github.com/Mozilla-Ocho/llamafile?utm_source=substack&utm_medium=email)

AI 涉及到方方面面，它不是一个独立的领域，但是它也有自己的基础设施，工作流。

对于大语言模型尚未如此热门之前，大家的工作流是这样的

数据标注，数据湖仓，数据提炼

模型训练，模型微调

模型部署

在大语言模型时代，新的领域被催生了

帮助提炼文档特征的文档工程师

提示词工程

模型小型化

Agent

Agent 和提示词编排

大语言模型审计和数据安全

提示词注入

## 临时

我关注的过去一周的 AI 热门项目：

XAgent 开源，比 AutoGPT 更加稳定和精确的复杂任务调度、设计、执行和落地的全自动 GPT Agent，与 Langchain 这样的单 Agent 或者多个单 Agent 智能体执行任务，以及 AutoGPT 执行任务的时候容易陷入自己的死循环和对错误进行错误处理和产生执念不同，XAgent 会将任务拆解和规划，逐步使用自己创建和调度的子 Agent 进行任务处理，甚至实现自己为了解决某个问题而单独训练一个小模型的情况，与 AutoGPT 会死循环不同，XAgent 添加了能找人类或者多个数据 ETL 模块进行求助的行为模式来允许自动任务发生中断

OpenBMB/XAgent: An Autonomous LLM Agent for Complex Task Solving

<https://github.com/OpenBMB/XAgent>

Prompt flow 开源，支持在 vscode 中流式可视化编辑和开发 GPT Agent，方便为 LLM 应用解决原型构建，基准测试，以及生产落地和监控。

microsoft/promptflow: Build high-quality LLM apps - from prototyping, testing to production deployment and monitoring.

<https://github.com/microsoft/promptflow>

AutoGen 开源，是 <https://github.com/microsoft/FLAML（> 自动机器学习和全自动微调框架 ）的衍生品，相比 AutoGPT 而言，这个项目旨在提供更多的多 agent 协作的工具，可以理解为 langchain multi agent 的平替，也可以理解为可以用 AutoGen 可以配合 Prompt flow 拼出一个 XAgent

microsoft/autogen: Enable Next-Gen Large Language Model Applications. Join our Discord: <https://discord.gg/pAbnFJrkgZ>

<https://github.com/microsoft/autogen>

看 NVIDIA 发了研究 Blog 说自己用类似于 XAgent 外循环 + 内循环的方式去让小模型和数字孪生能够对「对用人手进行转笔这样的动作进行建模」这样的复杂任务进行微调和监督，实现更全面和智能的无监督学习。

<https://blogs.nvidia.com/blog/2023/10/20/eureka-robotics-research/>

在 Minecraft 中玩游戏

MineDojo/Voyager: An Open-Ended Embodied Agent with Large Language Models
<https://github.com/MineDojo/Voyager>

[arXiv [2305.16291] Voyager: An Open-Ended Embodied Agent with Large Language Models](https://arxiv.org/abs/2305.16291)

Voyager | An Open-Ended Embodied Agent with Large Language Models
<https://voyager.minedojo.org/>

[新型人工智能算法可在5秒钟内从2D图像中创建3D模型 - VR / AR / 3D / IMAX - cnBeta.COM](https://www.cnbeta.com.tw/articles/tech/1396051.htm)

Frameworks for Serving LLMs. A comprehensive guide into LLMs inference and serving | by Sergei Savvov | Jul, 2023 | Medium | Better Programming
https://betterprogramming.pub/frameworks-for-serving-llms-60b7f7b23407

> X 上的 fin：“这是一篇打破GPT“涌现”概念神话的论文，终于说出了我一直以来的一个直觉，这才是比较符合事物发展规律的 一句话总结，所谓GPT“涌现”能力，是因为人为修改了“达标”的评价标准，给人"涌现"的错觉 一旦使用更合理的评价指标，就会发现GPT能力值随着模型增大是线性增长的，从评价指标上直接解构了“涌现”… https://t.co/NJv7jCjM4h” / X
https://twitter.com/fi56622380/status/1654386086746132481

Nature：DeepMind大模型突破60年数学难题 解法超出人类已有认知 - AI 人工智能 - cnBeta.COM
https://www.cnbeta.com.tw/articles/tech/1404741.htm

## 参考资料

[LLM Introduction: Learn Language Models](https://gist.github.com/rain-1/eebd5e5eb2784feecf450324e3341c8d)

[How ChatGPT works: a deep dive | Dan Hollick](https://typefully.com/DanHollick/how-chatgpt-works-a-deep-dive-yA3ppZC)

[Greg Brockman: The inside story of ChatGPT's astonishing potential | TED Talk](https://www.ted.com/talks/greg_brockman_the_inside_story_of_chatgpt_s_astonishing_potential)

[What Are Transformer Models and How Do They Work?](https://txt.cohere.com/what-are-transformer-models/)

[面向完全外行的chatGPT和大语言模型的介绍 – From nothing](http://hemin.live/archives/1143)

[Understanding Large Language Models](https://magazine.sebastianraschka.com/p/understanding-large-language-models?utm_source=direct&utm_campaign=post&utm_medium=web)

[关于 AI 的深度研究：ChatGPT 正在产生心智吗？](https://www.bilibili.com/video/BV1uu4y1m7ak)

[【渐构】万字科普GPT4为何会颠覆现有工作流；为何你要关注微软Copilot、文心一言等大模型 - 哔哩哔哩 bilibili](https://www.bilibili.com/video/BV1MY4y1R7EN/)

[2023年3月，人类终究走上了一条无法回头的路 - 哔哩哔哩 bilibili](https://www.bilibili.com/video/BV1VL411U7MU/)

[强烈推荐！台大李宏毅自注意力机制和Transformer详解！- 哔哩哔哩 bilibili](https://www.bilibili.com/video/BV1v3411r78R)

## 延伸阅读

- [when trees fall... | The New XOR Problem](https://blog.wtf.sg/posts/2023-02-03-the-new-xor-problem/)
- [hackerllama - The Random Transformer](https://osanseviero.github.io/hackerllama/blog/posts/random_transformer/)
- [The Illustrated Transformer – Jay Alammar – Visualizing machine learning one concept at a time.](https://jalammar.github.io/illustrated-transformer/)
- [Solving Transformer by Hand: A Step-by-Step Math Example | by Fareed Khan | Dec, 2023 | Level Up Coding](https://levelup.gitconnected.com/understanding-transformers-from-start-to-end-a-step-by-step-math-example-16d4e64e6eb1)
- [Normcore LLM Reads](https://gist.github.com/veekaybee/be375ab33085102f9027853128dc5f0e)

<Citation type="转载" source="Nólëbase" url="https://nolebase.ayaka.io/zh-CN/%E7%AC%94%E8%AE%B0/%F0%9F%A4%96%20AI%20%E4%BA%BA%E5%B7%A5%E6%99%BA%E8%83%BD/LLM%20%E6%98%AF%E5%A6%82%E4%BD%95%E5%B7%A5%E4%BD%9C%E7%9A%84%EF%BC%9F.html" />
