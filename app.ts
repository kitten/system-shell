import { App } from "astal/gtk4"
import style from "./style.scss"
import Bar from "./widget/Bar"
import OSD from "./widget/OSD"

App.start({
  instanceName: 'hyprpanel',
  css: style,
  main() {
    App.get_monitors().map(Bar);
    App.get_monitors().map(OSD);
  },
})
