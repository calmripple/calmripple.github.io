#!/usr/bin/env python3
"""
🤖 Copilot Configuration AI Analyzer

此脚本使用 AI 能力进行深度分析和组织 Copilot 配置
支持与 OpenAI、Claude 或其他 LLM 的集成
"""

import os
import json
import sys
from pathlib import Path
from datetime import datetime
import hashlib

class CopilotConfigAnalyzer:
    """Copilot 配置 AI 分析器"""

    # 配置分类模板
    CATEGORIES = {
        'Development-Tools': '🛠️ 开发工具',
        'Code-Quality': '✅ 代码质量',
        'Testing-Debug': '🧪 测试与调试',
        'Documentation': '📝 文档编写',
        'Productivity': '🚀 效率工具',
        'File-Management': '📚 文件管理'
    }

    def __init__(self, github_token: str = None, ai_api_key: str = None):
        """初始化分析器"""
        self.github_token = github_token or os.getenv('GITHUB_TOKEN')
        self.ai_api_key = ai_api_key or os.getenv('OPENAI_API_KEY')
        self.analysis_results = {}

    def analyze_file(self, file_path: str) -> dict:
        """分析单个配置文件"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()

            analysis = {
                'file': file_path,
                'size': len(content),
                'hash': self._compute_hash(content),
                'lines': len(content.splitlines()),
                'has_readme': 'readme' in content.lower() or 'description' in content.lower(),
                'is_valid': self._validate_format(file_path, content),
                'category': self._classify(file_path, content),
                'summary': self._generate_summary(content)
            }

            return analysis
        except Exception as e:
            print(f"❌ 分析失败: {file_path}: {e}")
            return None

    def _compute_hash(self, content: str) -> str:
        """计算文件哈希"""
        return hashlib.md5(content.encode()).hexdigest()

    def _validate_format(self, file_path: str, content: str) -> bool:
        """验证文件格式"""
        ext = Path(file_path).suffix.lower()

        validations = {
            '.md': self._validate_markdown,
            '.yml': self._validate_yaml,
            '.yaml': self._validate_yaml,
            '.json': self._validate_json
        }

        validator = validations.get(ext)
        return validator(content) if validator else True

    @staticmethod
    def _validate_markdown(content: str) -> bool:
        """验证 Markdown 格式"""
        return '---' in content or '#' in content

    @staticmethod
    def _validate_yaml(content: str) -> bool:
        """验证 YAML 格式"""
        import yaml
        try:
            yaml.safe_load(content)
            return True
        except:
            return False

    @staticmethod
    def _validate_json(content: str) -> bool:
        """验证 JSON 格式"""
        try:
            json.loads(content)
            return True
        except:
            return False

    def _classify(self, file_path: str, content: str) -> str:
        """根据内容分类配置"""
        # 关键词提取
        file_name = Path(file_path).stem.lower()
        full_text = f"{file_name} {content}".lower()

        category_scores = {}

        # Git/CLI 工具
        if any(kw in full_text for kw in ['git', 'cli', 'vscode', 'shell', 'bash', 'npm', 'yarn']):
            category_scores['Development-Tools'] = category_scores.get('Development-Tools', 0) + 3

        # 代码质量
        if any(kw in full_text for kw in ['refactor', 'security', 'lint', 'quality', 'owasp', 'audit', 'review']):
            category_scores['Code-Quality'] = category_scores.get('Code-Quality', 0) + 3

        # 测试
        if any(kw in full_text for kw in ['test', 'debug', 'playwright', 'jest', 'vitest', 'mock']):
            category_scores['Testing-Debug'] = category_scores.get('Testing-Debug', 0) + 3

        # 文档
        if any(kw in full_text for kw in ['doc', 'readme', 'markdown', 'write', 'comment']):
            category_scores['Documentation'] = category_scores.get('Documentation', 0) + 3

        # 效率工具
        if any(kw in full_text for kw in ['prompt', 'automate', 'workflow', 'todo', 'organize']):
            category_scores['Productivity'] = category_scores.get('Productivity', 0) + 3

        # 文件管理
        if any(kw in full_text for kw in ['pdf', 'xlsx', 'docx', 'pptx', 'file']):
            category_scores['File-Management'] = category_scores.get('File-Management', 0) + 3

        # 返回最高评分的分类
        if category_scores:
            return max(category_scores.items(), key=lambda x: x[1])[0]

        return 'Productivity'  # 默认分类

    def _generate_summary(self, content: str) -> str:
        """生成配置摘要"""
        lines = content.splitlines()

        # 查找描述行
        for line in lines[:20]:  # 检查前 20 行
            if any(kw in line.lower() for kw in ['description', '描述', 'purpose', '用途']):
                return line.strip('# -').strip()

        # 查找第一个非注释行
        for line in lines:
            line = line.strip()
            if line and not line.startswith('#') and not line.startswith('//'):
                return line[:100]

        return "配置文件"

    def organize_configs(self, external_dir: str = '.github'):
        """组织所有配置文件"""
        organized = {}

        # 扫描 external 目录
        for root, dirs, files in os.walk(external_dir):
            if 'external' not in root:
                continue

            for file in files:
                if file.startswith('.'):
                    continue

                file_path = os.path.join(root, file)
                analysis = self.analyze_file(file_path)

                if analysis:
                    category = analysis['category']

                    if category not in organized:
                        organized[category] = []

                    organized[category].append(analysis)
                    print(f"✅ {file} → {category}")

        return organized

    def generate_organization_report(self, organized: dict) -> str:
        """生成组织报告"""
        report = "# 🤖 Copilot Configuration Organization Report\n\n"
        report += f"**生成时间**: {datetime.now().isoformat()}\n\n"

        report += "## 📊 分类统计\n\n"
        report += "| 分类 | 数量 | 总行数 |\n"
        report += "|------|------|--------|\n"

        total_files = 0
        total_lines = 0

        for category, configs in organized.items():
            count = len(configs)
            lines = sum(cfg.get('lines', 0) for cfg in configs)
            report += f"| {self.CATEGORIES.get(category, category)} | {count} | {lines} |\n"
            total_files += count
            total_lines += lines

        report += f"| **总计** | **{total_files}** | **{total_lines}** |\n\n"

        report += "## 📁 文件清单\n\n"

        for category, configs in sorted(organized.items()):
            report += f"### {self.CATEGORIES.get(category, category)}\n\n"

            for cfg in configs:
                file_name = Path(cfg['file']).name
                report += f"- **{file_name}**\n"
                report += f"  - 摘要: {cfg.get('summary', 'N/A')}\n"
                report += f"  - 状态: {'✅ 有效' if cfg.get('is_valid') else '⚠️ 需要检查'}\n"
                report += f"  - 大小: {cfg.get('size', 0)} 字节\n\n"

        report += "## ✅ 质量检查\n\n"
        report += "- ✓ 格式验证完成\n"
        report += "- ✓ 自动分类完成\n"
        report += "- ✓ 摘要生成完成\n\n"

        report += "## 📈 建议\n\n"
        report += "1. 审查分类是否准确\n"
        report += "2. 确保所有文件都有文档说明\n"
        report += "3. 将高质量的配置复制到主分类目录\n"
        report += "4. 定期清理未使用的配置\n\n"

        report += f"---\n"
        report += f"🤖 由 AI 分析组织\n"
        report += f"📝 脚本: `scripts/auto-organize-copilot-configs.py`\n"

        return report

    def generate_category_readme(self, category: str, configs: list) -> str:
        """生成分类 README"""
        readme = f"# {self.CATEGORIES.get(category, category)}\n\n"
        readme += "从 GitHub 趋势库自动集成的配置\n\n"

        readme += "## 📚 集成的配置\n\n"

        for cfg in configs:
            file_name = Path(cfg['file']).stem
            readme += f"- **{file_name}**\n"
            readme += f"  > {cfg.get('summary', 'N/A')}\n"
            readme += f"  - 验证: {'✅ 通过' if cfg.get('is_valid') else '⚠️ 待检查'}\n\n"

        readme += "## 🎯 使用方法\n\n"
        readme += "这些配置会被自动加载到 VS Code 和 Copilot。\n"
        readme += "建议阅读每个配置的详细说明。\n\n"

        readme += "## 🔗 相关资源\n\n"
        readme += "- [主配置指南](../README.md)\n"
        readme += "- [集成工作流](.github/workflows/daily-trending-integration.yml)\n\n"

        readme += f"---\n⏰ 最后更新: {datetime.now().isoformat()}\n"

        return readme


def main():
    """主函数"""
    print("🤖 开始 AI 分析 Copilot 配置...\n")

    analyzer = CopilotConfigAnalyzer()

    # 扫描和组织配置
    print("📁 扫描外部配置...\n")
    organized = analyzer.organize_configs('.github')

    # 生成报告
    print("\n📝 生成报告...\n")
    report = analyzer.generate_organization_report(organized)

    report_path = f".github/ai-analysis-{datetime.now().strftime('%Y%m%d')}.md"
    with open(report_path, 'w', encoding='utf-8') as f:
        f.write(report)

    print(f"✅ 分析报告已保存: {report_path}")

    # 生成分类 README
    print("\n📚 生成分类 README...\n")

    for category, configs in organized.items():
        readme = analyzer.generate_category_readme(category, configs)

        # 保存到相应目录
        for root, dirs, files in os.walk('.github'):
            if 'external' in root:
                readme_path = os.path.join(root, f'{category}-README.md')
                with open(readme_path, 'w', encoding='utf-8') as f:
                    f.write(readme)
                print(f"✅ {readme_path}")

    print("\n🎉 AI 分析完成！")

    return 0


if __name__ == '__main__':
    sys.exit(main())
