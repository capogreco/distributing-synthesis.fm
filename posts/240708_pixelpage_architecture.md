---
title: Pixelpage Architecture
published_at: 2024-07-08
snippet: Appropriating an edge-friendly server architecture
disable_html_sanitization: true
---

![pixelpage website](/240708/pixelpage.png)

In this post we will investigate the server-side mechanics of how [Pixelpage](https://github.com/denoland/pixelpage): 
- recieves data from user input in a single client instances using [Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch), 
- stores data to a database using [Deno KV](https://docs.deno.com/deploy/kv/manual/), and 
- propagates that data back out to all client instances, using Deno Deploy's [BroadcastChannel API](https://docs.deno.com/deploy/api/runtime-broadcast-channel/) and [server-sent events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events).

## Fresh Structure
Pixelpage takes its file structure from [Deno Fresh](https://fresh.deno.dev/docs/introduction):

```
├── components
│   ├── ColorPicker.tsx
│   └── PixelGrid.tsx
├── islands
│   └── Pixels.tsx
├── routes
│   ├── api
│   │   ├── listen.ts
│   │   └── update.ts
│   └── index.tsx
├── shared
│   ├── constants.ts
│   ├── db.ts
│   └── types.ts
├── static
│   ├── favicon.ico
│   ├── logo.jpg
│   └── screenshot.png
├── LICENSE
├── README.md
├── deno.json
├── deno.lock
├── dev.ts
├── fresh.gen.ts
├── main.ts
└── twind.config.ts
```

The components folder contains what Fresh calls *[server components](https://fresh.deno.dev/docs/concepts/server-components)* - inert, javascriptless components rendered by the server and sent to the client, which exist in the `/componenets`.

Conversely, any interactive / client-side javascript you want to run must exist as an *[interactive island](https://fresh.deno.dev/docs/concepts/islands)*, in the `/islands` folder.

The `/routes` folder contains code defining how requests are handled, and as such `/routes/index.tsx` represents the public facing entrypoint, and the `/routes/api` folder represents interfaces which allow data into and out of from the servers.

The `/shared` folder holds modules which can be imported to elsewhere in the web-app, and the `/static` folder holds assets which do not require any sort of client-side or server-side rendering.

## `index.tsx`

```js
import { Head } from "$fresh/runtime.ts";
import { Handlers, PageProps } from "$fresh/server.ts";
import Pixels from "../islands/Pixels.tsx";
import { getGrid } from "../shared/db.ts";
import { Grid } from "../shared/types.ts";

export const handler: Handlers<Grid> = {
  async GET(_req, ctx) {
    const grid = await getGrid();
    return ctx.render(grid);
  },
};

export default function Home(props: PageProps<Grid>) {
  return (
    <>
      <Head>
        <title>pixelpage</title>
        <link rel="icon" type="image/jpg" href="/logo.jpg" />
      </Head>
      <div class="p-4 mx-auto max-w-screen-md flex justify-center">
        <Pixels grid={props.data} />
      </div>
      <div class="p-4 flex justify-evenly gap-8 text-center">
        <a
          href="https://github.com/denoland/pixelpage"
          class="text-blue-500 hover:underline"
        >
          View Source on GitHub
        </a>
        <a
          href="https://deno.com/deploy"
          class="text-blue-500 hover:underline"
        >
          Powered by Deno Deploy
        </a>
      </div>
    </>
  );
}
```

The [typescript](https://www.typescriptlang.org/docs/handbook/typescript-in-5-minutes.html) file, `index.tsx` exposes a handler object called `handler`, and a default export function called `Home` which returns [jsx](https://www.typescriptlang.org/docs/handbook/jsx.html) component.

The handler object uses the `getGrid()` function from `/shared/db.ts` to retrieve the current state of the pixel grid, and passes that into the component, which Deno has invisibly packaged on the `.render()` method of the second argument (`ctx`) passed in to the `GET` handler method.

For those who are curious, [Marvin Hagemeister](https://github.com/marvinhagemeister) generously provided me with this [psuedocode](https://en.wikipedia.org/wiki/Pseudocode) to help explain what exactly Deno is doing under the hood to achieve this:

```js
import { render as PreactRender } from "preact-render-to-string";
const route = await import("routes/my-route.tsx");

Deno.serve((req) => {
  const url = new URL(req.url);
  if (url.pathname === "/my-route") {
    const component = route.default;
    const handler =
      typeof route.handler === "object"
        ? route.handler
        : { GET: (ctx) => ctx.render() };

    const ctx = {
      render() {
        const html = PreactRender(component);
        return new Response(html, { headers: { "Content-Type": "text/html" } });
      },
    };

    return handler.GET(ctx);
  }
});
```

Once the `Home` component has the grid data, it passes it in to the `Pixel` component it has imported from `/islands/Pixels.tsx`.

## `Pixels.tsx`

```js
import { Signal } from "@preact/signals";

import { COLORS, WIDTH } from "../shared/constants.ts";
import { Grid } from "../shared/types.ts";

const PIXEL_SIZE = 24;
const DESKTOP_PIXEL_SIZE = 32;

export default function PixelGrid(
  props: {
    grid: Signal<Grid>;
    selected: Signal<number>;
    updateGrid(index: number, color: string): void;
  },
) {
  const { selected, updateGrid } = props;

  return (
    <div
      class={`grid grid-cols-${WIDTH} w-[${WIDTH * PIXEL_SIZE}px] sm:w-[${
        WIDTH * DESKTOP_PIXEL_SIZE
      }px] border`}
    >
      {props.grid.value.tiles.map((color, i) => (
        <div
          class={`w-[${PIXEL_SIZE}px] h-[${PIXEL_SIZE}px] sm:w-[${DESKTOP_PIXEL_SIZE}px] sm:h-[${DESKTOP_PIXEL_SIZE}px] bg-[${color}]`}
          onClick={() => {
            updateGrid(i, COLORS[selected.value]);
          }}
        >
        </div>
      ))}
    </div>
  );
}
```










