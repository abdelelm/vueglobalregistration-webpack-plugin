
# VueGlobalRegistration ![CI status](https://img.shields.io/badge/build-passing-brightgreen.svg)

Register globally components with name based on folder and generate routing based on folder and filename

## How to use
``` 
$ npm i vueglobalregistration-webpack-plugin -D
``` 
## Component 
If you have a folder structure like this :

```
.
├─ components
   ├── form
   │    ├── index.vue
   │    ├── _http.vue
   │    └── test.vue
   └── navigation
        ├── index.vue
        └── test.vue
```
 ### Configuration
You will need to add in the rules of your module key in your webpack configuration file this code :
```js
   {
        enforce: "pre",
        test: /app.js/,
        loader: VueGlobalRegistration.Register({
            type: "component",
            folder :  __dirname +  "/../src/components",
            recursive : true
        })
    }
``` 
### Result
When the type is `component` it will generate based on your folder structure the code to register the component. It will inject the code in the file (here it will be the `app.js`)

This is the generate code based on the example folder structure: 
```js
   import COMP0 from "./component/form/index.vue"
   import COMP1 from "./component/form/test.vue"
   import COMP2 from "./component/navigation.vue"
   import COMP3 from "./component/navigation/test.vue"
   Vue.component(COMP0.name || 'form' ,  COMP0)
   Vue.component(COMP1.name || 'form-test' ,  COMP1)
   Vue.component(COMP2.name || 'navigation' ,  COMP2)
   Vue.component(COMP4.name || 'navigation-test' ,  COMP3)
``` 

Like you see , it generate also a name based on the path of your component. but if the component has a name attribute it will take the name attribute to register the component.

### Injection
The module inject by default after the last import in the file. 
You can choice where he will inject by adding the replace key and the text he will replace.

webpack.config.js

```js
   {
        enforce: "pre",
        test: /app.js/,
        loader: VueGlobalRegistration.Register({
            type: "component",
            replace : "//<component>"
            folder :  __dirname +  "/../src/components",
            recursive : true
        })
    }
``` 
 app.js
```js 
  import Vue from "vue"
  import VueI18n from "vue-i18n"
  import { sync } from "vuex-router-sync"
  //<component>
``` 
## Routing
Writing the routing can also be generated.
If you have a folder structure like this :


```
.
├─ views
   ├── @connected
   │    ├── index.vue
   │    ├── logout.vue
   │    └── view_id_user.vue
   └── @public
   		├── notfound
        │    └── _index.vue
        ├── aboutme.vue
        ├── conditions.vue
        ├── index.vue
        └── info_id.vue
```
 ### Configuration
You will need to add in the rules of your module key in your webpack configuration file this code :

webpack.config.js

```js
	{
		enforce: "pre",
		test: /router.js/,
		loader: VueGlobalRegistration.Register({
			type: "routing",
			array : "routes",
			replace : "//<ROUTING>",
			folder : __dirname + "/../src/views",
			rules : [ {
				test :  /@connected/,
				meta : {
					connected :  true
				}
			  }
			]
		})
	}
``` 

router.js 
```js
import Vue from "vue"
import Router from "vue-router"
import NotFound from "views/@public/notfound/_index.vue"
let routes = [];
//<ROUTING>
// push as last element because the wildcard match will catch all the unknown urls
routes.push({ path: "*", component: NotFound})
Vue.use(Router)

// your code below ...

```

As you can see the `routing` has also a rules key which define the meta object for the different routes.
The rules has to be an object with a test and a meta key. 

- meta : object when the test is true
- test : regex object to test on the full path

The `routing` has also a `array`  key which define the array  variable name where you need to inject.



### Result
When the type is `routing` it will generate based on your folder structure the code to register the routes. It will inject the code in the file (here it will be the `index.js`)

This is the generate code based on the example folder structure: 
```js
   import ROUT0 from "./view/@connected/index.vue"
   import ROUT1 from "./view/@connected/logout.vue"
   import ROUT2 from "./view/@connected/view_id_user.vue"
   import ROUT3 from "./view/@public/aboutme.vue"
   import ROUT4 from "./view/@public/conditions.vue"
   import ROUT5 from "./view/@public/index.vue"
   import ROUT6 from "./view/@public/info_id.vue"
   
   routes.push({ path: '/', meta : {connected : true},  component: ROUT0 })
   routes.push({ path: '/logout', meta : {connected : true},  component: ROUT1 })
   routes.push({ path: '/view/:id/:user', meta : {connected : true},  component: ROUT2 })
   routes.push({ path: '/aboutme', meta : {},  component: ROUT3 })
   routes.push({ path: '/conditions', meta : {},  component: ROUT4 })
   routes.push({ path: '/', meta : {},  component: ROUT5 })
   routes.push({ path: '/info/:id', meta : {},  component: ROUT6 })
``` 

Like you see , it generate also a name based on the path of your component. but if the component has a name attribute it will take the name attribute to register the component.

## Notice

- You have to know that the order of folder will be important if you use the same route
- Folder starting with a `@` will  not be added to name of routes
- Files starting with `_` will be skipped  	
 
