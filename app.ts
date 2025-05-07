import { App } from "astal/gtk4"
import style from "./style.scss"

import Bar from "./widget/Bar"
import OSD from "./widget/OSD"
import Notifications from "./widget/Notifications"
import Launcher from "./widget/Launcher"

App.start({
  instanceName: 'hyprpanel',
  css: style,
  main() {
    App.get_monitors().map(Bar);
    App.get_monitors().map(OSD);
    App.get_monitors().map(Notifications);
  },
  requestHandler(request, respond) {
    if (request === 'launcher') {
      Launcher();
      respond('ok');
    }
  },
  client(message, ...args) {
    if (args[0] === 'launcher') {
      message('launcher');
    }
  },
})
