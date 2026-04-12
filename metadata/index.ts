import type { Creator } from '../scripts/types/metadata'
import { getAvatarUrlByGithubName } from '../scripts/utils'

/** 文本 */
export const siteName = '知在'
export const siteShortName = '知在'
export const siteDescription = '参与并理解世界'

/** 文档所在目录 */
export const include = ['笔记', '生活']

/** Repo */
export const githubRepoLink = 'https://github.com/knewbeing/nolebase'
/** 历史仓库 */
export const legacyGithubRepoLink = 'https://github.com/calmripple/calmripple.github.io'
/** Mastodon */
export const mastodonLink = 'https://mastodon.social/@knewbeing'

/** 无协议前缀域名 */
export const plainTargetDomain = 'www.dmsrs.org'
/** 完整域名 */
export const targetDomain = `https://${plainTargetDomain}`

/** 创作者 */
export const creators: Creator[] = [
  {
    name: 'knewbeing',
    avatar: '',
    username: 'knewbeing',
    title: '知在 作者',
    desc: '全栈开发者，专注于 VitePress、前端工具链、开源项目开发',
    links: [
      { type: 'github', icon: 'github', link: 'https://github.com/knewbeing' },
      { type: 'website', icon: 'website', link: 'https://www.dmsrs.org' },
    ],
    nameAliases: ['knewbeing', '钮必赢', 'Niǔ Bì Yíng'],
    emailAliases: ['zz@dmsrs.org'],
  },
].map<Creator>((c) => {
  c.avatar = c.avatar || getAvatarUrlByGithubName(c.username)
  return c as Creator
})

export const creatorNames = creators.map(c => c.name)
export const creatorUsernames = creators.map(c => c.username || '')
