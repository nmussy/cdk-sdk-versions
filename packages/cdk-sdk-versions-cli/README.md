oclif-hello-world
=================

oclif example Hello World CLI

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)

<!-- toc -->
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->
# Usage
<!-- usage -->
```sh-session
$ cdk-sdk-versions COMMAND
running command...
$ cdk-sdk-versions (--version)
cdk-sdk-versions-cli/0.0.0 darwin-arm64 node-v21.6.2
$ cdk-sdk-versions --help [COMMAND]
USAGE
  $ cdk-sdk-versions COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`cdk-sdk-versions hello PERSON`](#cdk-sdk-versions-hello-person)
* [`cdk-sdk-versions hello world`](#cdk-sdk-versions-hello-world)
* [`cdk-sdk-versions help [COMMAND]`](#cdk-sdk-versions-help-command)
* [`cdk-sdk-versions plugins`](#cdk-sdk-versions-plugins)
* [`cdk-sdk-versions plugins:install PLUGIN...`](#cdk-sdk-versions-pluginsinstall-plugin)
* [`cdk-sdk-versions plugins:inspect PLUGIN...`](#cdk-sdk-versions-pluginsinspect-plugin)
* [`cdk-sdk-versions plugins:install PLUGIN...`](#cdk-sdk-versions-pluginsinstall-plugin-1)
* [`cdk-sdk-versions plugins:link PLUGIN`](#cdk-sdk-versions-pluginslink-plugin)
* [`cdk-sdk-versions plugins:uninstall PLUGIN...`](#cdk-sdk-versions-pluginsuninstall-plugin)
* [`cdk-sdk-versions plugins reset`](#cdk-sdk-versions-plugins-reset)
* [`cdk-sdk-versions plugins:uninstall PLUGIN...`](#cdk-sdk-versions-pluginsuninstall-plugin-1)
* [`cdk-sdk-versions plugins:uninstall PLUGIN...`](#cdk-sdk-versions-pluginsuninstall-plugin-2)
* [`cdk-sdk-versions plugins update`](#cdk-sdk-versions-plugins-update)

## `cdk-sdk-versions hello PERSON`

Say hello

```
USAGE
  $ cdk-sdk-versions hello PERSON -f <value>

ARGUMENTS
  PERSON  Person to say hello to

FLAGS
  -f, --from=<value>  (required) Who is saying hello

DESCRIPTION
  Say hello

EXAMPLES
  $ oex hello friend --from oclif
  hello friend from oclif! (./src/commands/hello/index.ts)
```

_See code: [src/commands/hello/index.ts](https://github.com/nmussy/cdk-sdk-versions/blob/v0.0.0/src/commands/hello/index.ts)_

## `cdk-sdk-versions hello world`

Say hello world

```
USAGE
  $ cdk-sdk-versions hello world

DESCRIPTION
  Say hello world

EXAMPLES
  $ cdk-sdk-versions hello world
  hello world! (./src/commands/hello/world.ts)
```

_See code: [src/commands/hello/world.ts](https://github.com/nmussy/cdk-sdk-versions/blob/v0.0.0/src/commands/hello/world.ts)_

## `cdk-sdk-versions help [COMMAND]`

Display help for cdk-sdk-versions.

```
USAGE
  $ cdk-sdk-versions help [COMMAND] [-n]

ARGUMENTS
  COMMAND  Command to show help for.

FLAGS
  -n, --nested-commands  Include all nested commands in the output.

DESCRIPTION
  Display help for cdk-sdk-versions.
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v6.0.17/src/commands/help.ts)_

## `cdk-sdk-versions plugins`

List installed plugins.

```
USAGE
  $ cdk-sdk-versions plugins [--json] [--core]

FLAGS
  --core  Show core plugins.

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  List installed plugins.

EXAMPLES
  $ cdk-sdk-versions plugins
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v4.2.6/src/commands/plugins/index.ts)_

## `cdk-sdk-versions plugins:install PLUGIN...`

Installs a plugin into the CLI.

```
USAGE
  $ cdk-sdk-versions plugins add plugins:install PLUGIN...

ARGUMENTS
  PLUGIN  Plugin to install.

FLAGS
  -f, --force    Run yarn install with force flag.
  -h, --help     Show CLI help.
  -s, --silent   Silences yarn output.
  -v, --verbose  Show verbose yarn output.

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Installs a plugin into the CLI.
  Can be installed from npm or a git url.

  Installation of a user-installed plugin will override a core plugin.

  e.g. If you have a core plugin that has a 'hello' command, installing a user-installed plugin with a 'hello' command
  will override the core plugin implementation. This is useful if a user needs to update core plugin functionality in
  the CLI without the need to patch and update the whole CLI.


ALIASES
  $ cdk-sdk-versions plugins add

EXAMPLES
  $ cdk-sdk-versions plugins add myplugin 

  $ cdk-sdk-versions plugins add https://github.com/someuser/someplugin

  $ cdk-sdk-versions plugins add someuser/someplugin
```

## `cdk-sdk-versions plugins:inspect PLUGIN...`

Displays installation properties of a plugin.

```
USAGE
  $ cdk-sdk-versions plugins inspect PLUGIN...

ARGUMENTS
  PLUGIN  [default: .] Plugin to inspect.

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Displays installation properties of a plugin.

EXAMPLES
  $ cdk-sdk-versions plugins inspect myplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v4.2.6/src/commands/plugins/inspect.ts)_

## `cdk-sdk-versions plugins:install PLUGIN...`

Installs a plugin into the CLI.

```
USAGE
  $ cdk-sdk-versions plugins install PLUGIN...

ARGUMENTS
  PLUGIN  Plugin to install.

FLAGS
  -f, --force    Run yarn install with force flag.
  -h, --help     Show CLI help.
  -s, --silent   Silences yarn output.
  -v, --verbose  Show verbose yarn output.

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Installs a plugin into the CLI.
  Can be installed from npm or a git url.

  Installation of a user-installed plugin will override a core plugin.

  e.g. If you have a core plugin that has a 'hello' command, installing a user-installed plugin with a 'hello' command
  will override the core plugin implementation. This is useful if a user needs to update core plugin functionality in
  the CLI without the need to patch and update the whole CLI.


ALIASES
  $ cdk-sdk-versions plugins add

EXAMPLES
  $ cdk-sdk-versions plugins install myplugin 

  $ cdk-sdk-versions plugins install https://github.com/someuser/someplugin

  $ cdk-sdk-versions plugins install someuser/someplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v4.2.6/src/commands/plugins/install.ts)_

## `cdk-sdk-versions plugins:link PLUGIN`

Links a plugin into the CLI for development.

```
USAGE
  $ cdk-sdk-versions plugins link PLUGIN

ARGUMENTS
  PATH  [default: .] path to plugin

FLAGS
  -h, --help          Show CLI help.
  -v, --verbose
      --[no-]install  Install dependencies after linking the plugin.

DESCRIPTION
  Links a plugin into the CLI for development.
  Installation of a linked plugin will override a user-installed or core plugin.

  e.g. If you have a user-installed or core plugin that has a 'hello' command, installing a linked plugin with a 'hello'
  command will override the user-installed or core plugin implementation. This is useful for development work.


EXAMPLES
  $ cdk-sdk-versions plugins link myplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v4.2.6/src/commands/plugins/link.ts)_

## `cdk-sdk-versions plugins:uninstall PLUGIN...`

Removes a plugin from the CLI.

```
USAGE
  $ cdk-sdk-versions plugins remove plugins:uninstall PLUGIN...

ARGUMENTS
  PLUGIN  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ cdk-sdk-versions plugins unlink
  $ cdk-sdk-versions plugins remove

EXAMPLES
  $ cdk-sdk-versions plugins remove myplugin
```

## `cdk-sdk-versions plugins reset`

Remove all user-installed and linked plugins.

```
USAGE
  $ cdk-sdk-versions plugins reset [--hard] [--reinstall]

FLAGS
  --hard       Delete node_modules and package manager related files in addition to uninstalling plugins.
  --reinstall  Reinstall all plugins after uninstalling.
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v4.2.6/src/commands/plugins/reset.ts)_

## `cdk-sdk-versions plugins:uninstall PLUGIN...`

Removes a plugin from the CLI.

```
USAGE
  $ cdk-sdk-versions plugins uninstall PLUGIN...

ARGUMENTS
  PLUGIN  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ cdk-sdk-versions plugins unlink
  $ cdk-sdk-versions plugins remove

EXAMPLES
  $ cdk-sdk-versions plugins uninstall myplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v4.2.6/src/commands/plugins/uninstall.ts)_

## `cdk-sdk-versions plugins:uninstall PLUGIN...`

Removes a plugin from the CLI.

```
USAGE
  $ cdk-sdk-versions plugins unlink plugins:uninstall PLUGIN...

ARGUMENTS
  PLUGIN  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ cdk-sdk-versions plugins unlink
  $ cdk-sdk-versions plugins remove

EXAMPLES
  $ cdk-sdk-versions plugins unlink myplugin
```

## `cdk-sdk-versions plugins update`

Update installed plugins.

```
USAGE
  $ cdk-sdk-versions plugins update [-h] [-v]

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Update installed plugins.
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v4.2.6/src/commands/plugins/update.ts)_
<!-- commandsstop -->
