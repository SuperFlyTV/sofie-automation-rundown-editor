import VueRouter from "vue-router"

import Home from '../views/Home.vue'
import Playlist from '../views/Playlist.vue'
import Rundown from '../views/Rundown.vue'
import Settings from '../views/Settings.vue'

import Header from '../components/Header.vue'
import RundownEditor from '../components/rundown/RundownEditor.vue'
import SegmentEditor from '../components/rundown/SegmentEditor.vue'
import PartEditor from '../components/rundown/PartEditor.vue'
import PieceList from '../components/rundown/PieceList.vue'
import PieceEditor from '../components/rundown/PieceEditor.vue'

export const router = new VueRouter({
  routes: [
    {
      path: '/',
      component: Home,
      components: {
        header: Header,
        default: Home,
      }
    },
    {
      path: '/playlist/:id',
      component: Playlist,
      components: {
        header: Header,
        default: Playlist,
      }
    },
    {
      path: '/rundown/:id',
      component: Rundown,
      children: [
        {
          path: '',
          components: {
            'rundown-left': RundownEditor
          }
        },
        {
          path: 'segment/:segment',
          components: {
            'rundown-left': SegmentEditor
          }
        },
        {
          path: 'part/:part',
          components: {
            'rundown-left': PartEditor,
            'rundown-right': PieceList,
          }
        },
        {
          path: 'piece/:piece',
          components: {
            'rundown-left': PieceList,
            'rundown-right': PieceEditor,
          }
        }
      ]
    },
    {
      path: '/settings',
      components: {
        header: Header,
        default: Settings,
      }
    },

  ]
})