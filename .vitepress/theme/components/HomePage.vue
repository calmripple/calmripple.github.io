<script setup lang="ts">
import { VPTeamMembers } from 'vitepress/theme'
import { creators, siteName } from '../../../metadata'
</script>

<template>
  <div class="content">
    <div class="content-container">
      <main class="main">
        <div class="vp-doc" mt-10 flex flex-col items-center>
          <h2 id="meet-the-team" font-normal op50 p="t-10 b-2">
            {{ siteName }} 的创作者
          </h2>
          <div w-full p-10>
            <VPTeamMembers size="small" :members="creators" flex justify-center />
          </div>

          <div>
            <h2 mt-11 pb-2 text-center>
              <span>
                赞助者
              </span>
            </h2>
            <div flex justify-center>
              <img src="https://cdn.jsdelivr.net/gh/calmripple/sponsors/sponsors.wide.svg">
            </div>

            <p text-center>
              这个项目得以实现，要感谢所有支持我们的 Sponsors<br>
              你也可以访问我们的 Sponsors 页面来加入其中：
            </p>
            <p flex justify-center gap-4>
              <a href="https://github.com/sponsors/beknowing" target="_blank"><img src="https://img.shields.io/static/v1?label=Sponsor&message=Rizumu&logo=GitHub&color=%23fe8e86&style=for-the-badge"></a>
              <a href="https://github.com/sponsors/beingknowing" target="_blank"><img src="https://img.shields.io/static/v1?label=Sponsor&message=Neko&logo=GitHub&color=%23fe8e86&style=for-the-badge"></a>
            </p>

            <h2 text="center lg" my-5 font-bold>
              💕 感谢所有贡献者！
            </h2>

            <a href="https://github.com/calmripple/nolebase/graphs/contributors">
              <img src="https://contrib.rocks/image?repo=nolebase/nolebase">
            </a>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>
