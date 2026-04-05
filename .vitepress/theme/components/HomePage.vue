<script setup lang="ts">
import { creators, siteName } from '@metadata'
import { VPTeamMembers } from 'vitepress/theme'
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
            <h2 text="center lg" my-5 font-bold>
              💕 感谢所有贡献者！
            </h2>

            <a href="https://github.com/calmripple/calmripple.github.io/graphs/contributors">
              <img src="https://contrib.rocks/image?repo=calmripple/calmripple.github.io">
            </a>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>
