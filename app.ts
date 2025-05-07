import { App } from "astal/gtk4"
import style from "./style.scss"

import Players from "./utils/players"
import Bar from "./widget/Bar"
import OSD from "./widget/OSD"
import Notifications from "./widget/Notifications"
import Launcher from "./widget/Launcher"

function main(request: string | undefined): boolean {
  switch (request) {
    case 'launcher':
      Launcher();
      return true;
    case 'play_pause':
      Players.get_default().play_pause();
      return true;
    case 'play_next':
      Players.get_default().play_next();
      return true;
    case 'play_previous':
      Players.get_default().play_next();
      return true;
    default:
      return false;
  }
}

App.start({
  instanceName: 'hyprpanel',
  css: style,
  main(arg0) {
    if (!arg0) {
      Players.get_default();
      App.get_monitors().map(Bar);
      App.get_monitors().map(OSD);
      App.get_monitors().map(Notifications);
    } else if (!main(arg0)) {
      throw new Error('Unhandled command');
    }
  },
  requestHandler(request, respond) {
    return respond(main(request) ? 0 : -1);
  },
  client(message, arg0) {
    if (!arg0) {
      throw new Error('Already running');
    } else {
      const status = Number(message(arg0 ?? ''));
      if (status !== 0) {
        throw new Error('Unhandled request');
      }
    }
  },
})
