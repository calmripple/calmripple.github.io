<script setup lang="ts">
import { creators, githubUsername, siteName } from '@metadata'
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

          <div my-6 text-center>
            <h2 text="center lg" my-4 font-bold>
              ❤️ Sponsors
            </h2>
            <a
              :href="`https://github.com/sponsors/${githubUsername}`"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img
                :src="`https://img.shields.io/static/v1?label=Sponsor&message=${githubUsername}&logo=GitHub&color=%23fe8e86&style=for-the-badge`"
                alt="Sponsor on GitHub"
              >
            </a>
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
