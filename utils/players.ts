import GObject, { register } from "astal/gobject"

import AstalMpris from "gi://AstalMpris"
import { bind } from "astal"

@register({ GTypeName: 'Players' })
export default class Players extends GObject.Object {
  static instance: Players

  static get_default() {
    if (!this.instance) this.instance = new Players();
    return this.instance;
  }

  #lastActivePlayer: AstalMpris.Player | null = null;

  constructor() {
    super();

    const mpris = AstalMpris.get_default();
    const state = new Map<AstalMpris.Player, () => void>();

    const onPlayerPlaybackStatusChange = (player: AstalMpris.Player, status: AstalMpris.PlaybackStatus) => {
      if (status === AstalMpris.PlaybackStatus.PLAYING) {
        this.#lastActivePlayer = player;
      } else if (status === AstalMpris.PlaybackStatus.STOPPED && this.#lastActivePlayer === player) {
        this.#lastActivePlayer = null;
      }
    };

    const onPlayerAdded = (player: AstalMpris.Player) => {
      if (!state.has(player)) {
        onPlayerPlaybackStatusChange(player, player.playbackStatus);
        state.set(player, bind(player, 'playbackStatus').subscribe((status) => {
          onPlayerPlaybackStatusChange(player, status);
        }));
      }
    };

    const onPlayerClosed = (player: AstalMpris.Player) => {
      state.get(player)?.();
      if (this.#lastActivePlayer === player) {
        this.#lastActivePlayer = null;
      }
    };

    mpris.get_players().forEach(onPlayerAdded);

    mpris.connect('player-added', (_source, player) => {
      if (!this.#lastActivePlayer)
        this.#lastActivePlayer = player;
      onPlayerAdded(player);
    });

    mpris.connect('player-closed', (_source, player) => {
      onPlayerClosed(player);
    });
  }

  play_pause() {
    this.#lastActivePlayer?.play_pause();
  }

  play_next() {
    this.#lastActivePlayer?.next();
  }

  play_previous() {
    this.#lastActivePlayer?.previous();
  }
}
