---
sidebar:
 title: dotnet
 step: 0
isTimeLine: true
title: nuget 修改 package存储位置
date: 2024-11-21
tags:
 - dotnet
 - vscode
categories:
 - coding
---
# 要修改 NuGet 包存储位置，您需要更改 NuGet 配置文件或使用命令行参数。以下是如何执行此操作的步骤：

### 方法一：修改 NuGet 配置文件

1. 打开 NuGet 配置文件。配置文件通常位于以下位置：
   - Windows: `%AppData%\NuGet\NuGet.Config`
   - macOS/Linux: `$HOME/.config/NuGet/NuGet.Config`

   如果您找不到配置文件，可以在命令行中使用 `nuget config -list` 命令查看当前的 NuGet 配置。

2. 在配置文件中添加或修改 `<packageSources>` 部分，指定新的存储位置。例如，要将包存储位置更改为 `D:\NuGetPackages`，请添加或修改以下内容：

   ```xml
   <configuration>
     <packageSources>
       <add key="MyCustomPackages" value="D:\NuGetPackages" />
     </packageSources>
   </configuration>
   ```

   这里的 `key` 是您自定义的源名称，`value` 是新的存储位置。

3. 保存并关闭配置文件。

### 方法二：使用命令行参数

您还可以在安装或更新 NuGet 包时使用 `-Source` 参数指定新的存储位置。例如：

```sh
dotnet nuget install <package_name> -Source D:\NuGetPackages
```

或者，在更新 NuGet 包时：

```sh
dotnet nuget update <package_name> -Source D:\NuGetPackages
```

### 方法三：设置全局默认源

如果您希望将新的存储位置设置为全局默认源，可以使用以下命令：

```sh
dotnet nuget config -set globalPackagesFolder=D:\NuGetPackages
```

这会将全局包文件夹设置为 `D:\NuGetPackages`。

### 总结

通过以上方法，您可以轻松地修改 NuGet 包的存储位置。根据您的需求和偏好，您可以选择修改配置文件或使用命令行参数来实现这一目标。
