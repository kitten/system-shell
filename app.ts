import { App } from "astal/gtk4"
import style from "./style.scss"
import Bar from "./widget/Bar"
import OSD from "./widget/OSD"
import Notifications from "./widget/Notifications"

App.start({
  instanceName: 'hyprpanel',
  css: style,
  main() {
    App.get_monitors().map(Bar);
    App.get_monitors().map(OSD);
    App.get_monitors().map(Notifications);
  },
})
