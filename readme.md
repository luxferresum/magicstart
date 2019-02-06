# EXPERIMENTAL!!!

# magicstart

magicstart is a simple build pipeline to easily build, serve, and test express applications.

# installation

```
yarn add --dev magicstart
```
or
```
npm install --save-dev magicstart

```

# usage

## yarn run magicstart test

This will build the project in the `src` folder, tests in the `test` folder and then run the mocha testrunner for all files in the `test` folder.

For this the `dist_testing` folder will be created with 2 subfolders. A folder `src` containing the tests and a folder `test` containing the tests.

A `--watch` parameter can be specified for watch mode. Then magicstart will watch the `src` and `test` folder and automagically rerun the tests.

## yarn run magicstart serve

This will build the project in the `src` folder.
For this the `dist_server` folder will be created containing the output.
A internal express server will be started on port 3000.

The project is expected to have a file named `router.js` exporting a express router.
On successfull build this router will be loaded and all requestst to `/api` will be redirected to the router. Magicstart will also watch the files in the `src` project. Whenever a file changes magicstart will rebuild the project and then do a no-downtime switch to the new source.

## yarn run magicstart build

This will build the project in the `src` folder.
For this the `dist` folder will be created containing the output.
Additionally a `server.js` fill will be created.

# Options

| Option        | Description                                | default                  |
|---------------|--------------------------------------------|---------------------------
| srcTree       | tree for sources                           | `new Funnel('src')`      |
| testTree      | tree for the tests                         | `new Funnel('test')`     |
| testingTree   | a tree containing test & src               |                          |
| router        | name of the router file                    | `'router.js'`            |
| routerPrefix  | prefix for the route handles by the router | `'/api'`                 |
| port          | port for the server                        | `3000`                   |
-----------------------------------------------------------------------------------------
