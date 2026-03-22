import type { Creator } from '../scripts/types/metadata'
import { getAvatarUrlByGithubName } from '../scripts/utils'

/** 文本 */
export const siteName = '知在'
export const siteShortName = '知在'
export const siteDescription = '记录回忆，知识和畅想的地方'

/** 文档所在目录 */
export const include = ['笔记', '生活']

/** Repo */
export const githubRepoLink = 'https://github.com/calmripple/nolebase'
/** Discord */
export const discordLink = 'https://discord.gg/XuNFDcDZGj'

/** 无协议前缀域名 */
export const plainTargetDomain = 'nolebase.ayaka.io'
/** 完整域名 */
export const targetDomain = `https://${plainTargetDomain}`

/** 创作者 */
export const creators: Creator[] = [
  {
    name: '知在',
    avatar: '',
    username: 'beingknowing',
    title: '知在 原始创作者',
    desc: '开发者，专注于基础设施维护，数据分析，后端、DevOps 开发。通过知识与觉知，参与并理解所处的存在情境。',
    links: [
      { type: 'github', icon: 'github', link: 'https://github.com/beingknowing' },
      { type: 'twitter', icon: 'twitter', link: 'https://twitter.com/ayakaneko' },
    ],
    nameAliases: ['beingknowing', 'beingknowing', '存在', 'being', 'သိထားပါတယ်', '知在'],
    emailAliases: ['neko@ayaka.moe'],
  },
  {
    name: '知在',
    avatar: '',
    username: 'beknowing',
    title: '知在 原始创作者',
    desc: '开源开发者，专注于前端，以及前端相关工具库和工具链开发。通过知识与觉知，参与并理解所处的存在情境。',
    links: [
      { type: 'github', icon: 'github', link: 'https://github.com/beknowing' },
      { type: 'twitter', icon: 'twitter', link: 'https://twitter.com/OikawaRizumu' },
    ],
    nameAliases: ['beknowing', 'Knowing', '认知', 'Rizumu Oikawa', 'Rizumu Ayaka', 'Ayaka Rizumu', 'Rizumu', '知在'],
    emailAliases: ['rizumu@ayaka.moe', 'rizumu@oqo.moe'],
  },
].map<Creator>((c) => {
  c.avatar = c.avatar || getAvatarUrlByGithubName(c.username)
  return c as Creator
})

export const creatorNames = creators.map(c => c.name)
export const creatorUsernames = creators.map(c => c.username || '')
