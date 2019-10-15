import "./icons.js"
import Swiper from "./swiper.js"

class Player {
  constructor(node) {  /*1️⃣这个 node 传递进来的时候，若想要兼容性好点
                        （即，用户可以传递一个“字符串”，也可以传递一个“DOM 节点”），
                        我们可以像这样先去做一个判断，然后进行初始化绑定；*/
    this.root = typeof node === "string" ? document.querySelector(node) : node;
    this.$ = selector => this.root.querySelector(selector)
    this.$$ = selector => this.root.querySelectorAll(selector)

    this.songList = []  /*3️⃣-①：音乐数据一开始是一个“空数组”，
                          后面通过 fetch 获取到后，就把数据放进去。*/

    this.currentIndex = 1  /*💡我要知道播放的是哪首音乐，可以先把索引初始化为 1。
                             然后当点击“上/下一曲”的时候，我们可以知道到底会播放哪一首。*/
    this.audio = new Audio()
    this.start()
    this.bind()
    this.lyricsArr = []
    this.lyricIndex = -1
   
  }

  start() {
    //1️⃣我们通过 fetch 的方式获取到“数据”：
    fetch("https://rivoc.github.io/data-mock/voo-music/music-list.json")
      .then(res => res.json())
      .then(data => {
        console.log(data)
        this.songList = data  //2️⃣然后将“数据”赋值给实例对象的 songList（箭头函数里的 this 指向它上一级的 this）；
        this.loadSong()  //3️⃣把获取到的“数据”先缓存起来；
      })
  }


  loadSong() {
    //5️⃣这个方法专门用于“缓存”数据；
    let songObj = this.songList[this.currentIndex]
    this.audio.src = songObj.url  //2️⃣接着给 this.audio 设置 src
    console.log(this.audio.src)
    //1️⃣将页面头部的“歌曲名”和“作者-专辑名”直接渲染出来：
  this.$("header h1").innerText = songObj.title
  this.$("header p").innerText = songObj.author + "-" + songObj.album
  
  /*2️⃣歌曲的加载有趣的地方就是，一首歌曲它会有个“总时长”，
  这里我们只是做一个逻辑——会将歌曲总时长放在“.time-end”，
  但具体以什么形式放，我们另起一个函数来说明。*/
  this.audio.onloadedmetadata = () => this.$(".time-end").innerText = this.formateTime(this.audio.duration)

  
  /*3️⃣在我们 mock 的数据格式中，我们需要通过“歌词”接口去专门获取“歌词”，
  所以这里我们去调用这个方法。*/
  this.loadLyric() 
  }
  loadLyric() {
    fetch(this.songList[this.currentIndex].lyric)  //1️⃣获取到 lyric；
      .then(res => res.json())
      .then(data => {
      
      //2️⃣模拟的数据格式中，lrc 目录下有 lyric 和 version；
      // console.log(data.lrc.lyric)
      
      /*❗️3️⃣这个函数的目的是“获取”到 lyric，
      而要把获取到的“歌词”怎么用，我们通过另一个函数去说明。
      💡我们随时要提醒自己：一个函数只做一件事！*/
      this.setLyrics(data.lrc.lyric)  
      
      window.lyrics = data.lrc.lyric
    })
  }
  setLyrics(lyrics) {
    this.lyricIndex = 0 
    let fragment = document.createDocumentFragment()
    let lyricsArr  = []
    this.lyricsArr = lyricsArr
    lyrics.split(/\n/)  //2️⃣可以得到如上图所示的“每一行”歌词——行与行是单独分开的；
      
      /*3️⃣过滤出歌词里边不包含如 [00:30.22] 这种格式的歌词——不是这种格式的话，
      它就不是一项有效的歌词；*/
      .filter(str => str.match(/\[.+?\]/))
    
      .forEach(line => {  //4️⃣对每一行歌词运用以下逻辑：
      
        /*4️⃣-①：替换掉前边的 [] 为“空字符”，得到一个纯的字符串；*/
        let str = line.replace(/\[.+?\]/g, "")  
        
        line.match(/\[.+?\]/g).forEach(t=>{  /*4️⃣-②：对匹配到的每一行的“时间”运用以下逻辑：*/
          
          /*4️⃣-②-1：把时间点的“中括号”去掉，得到一个单纯的时间，如 00:30.22 ；*/
          t = t.replace(/[\[\]]/g, "")
          
          /*4️⃣-②-2：将时间统一全部变成“毫秒”；*/
          let milliseconds = parseInt(t.slice(0,2))*60*1000 + parseInt(t.slice(3,5))*1000 + parseInt(t.slice(6))
          
          /*4️⃣-②-3：然后创建一个新的数组，数组里是时间“毫秒数”和歌词“字符串”，
          并依次把上边匹配好的“时间”和“歌词”放入 lyricsArr。*/
          lyricsArr.push([milliseconds, str])
        })
      })

      //5️⃣根据“时间”做一个比较排序：
      lyricsArr.filter(line => line[1].trim() !== "").sort((v1, v2) => {
        if(v1[0] > v2[0]) {
          return 1
        } else {
          return -1
        }
      }).forEach(line => {  //6️⃣：排序好后，对里边的每一条运用以下逻辑：
          let node = document.createElement("p")  //6️⃣-①：在页面创建一个 p 标签；
          
          /*6️⃣-②：给 p 标签设置一个 data-time 属性，
          然后把刚刚的时间毫秒数作为这个属性的值。*/
          node.setAttribute("data-time", line[0])  
        
          /*6️⃣-③：第二个参数“歌词”赋值给 p 的内容；*/
          node.innerText = line[1]
        
          /*6️⃣-④：把 p 放到虚拟 DOM 里边；*/
          fragment.appendChild(node)
        })
   
      this.$(".panel-lyrics .container").innerHTML = ""
    
      /*7️⃣：把虚拟 DOM 放在 container 里边。*/
      this.$(".panel-lyrics .container").appendChild(fragment)
  }
  locateLyric() {
    console.log("locateLyric")

    let currentTime = this.audio.currentTime*1000  //1️⃣获取到当前音乐的时间毫秒数；
    
    let nextLineTime = this.lyricsArr[this.lyricIndex+1][0]
    
    /*2️⃣播放歌曲的时间大于 DOM 元素*/
    if(currentTime > nextLineTime && this.lyricIndex < this.lyricsArr.length - 1) {
      this.lyricIndex++
      
      let node = this.$('[data-time="'+this.lyricsArr[this.lyricIndex][0]+'"]')
      
      // 3️⃣调用 setLyricToCenter 方法，并传入参数 node ；
      if(node) this.setLyricToCenter(node)

      
      //4️⃣我们一并在这里把 panel-effect 面板上的两行歌词也渲染出来。
      this.$$(".panel-effect .lyric p")[0].innerText = this.lyricsArr[this.lyricIndex][1]
      this.$$(".panel-effect .lyric p")[1].innerText = this.lyricsArr[this.lyricIndex+1] ? this.lyricsArr[this.lyricIndex+1][1] : ""
      
    }
  }
  setLyricToCenter(node) {
    console.log(node)
    
    //偏移的高度；
    let translateY = node.offsetTop - this.$(".panel-lyrics").offsetHeight / 2
    
    //1️⃣对计算出的“高度”做一个判断，看看是“情况 1”(到屏幕中间的歌词部分）还是“情况 2”；
    translateY = translateY > 0 ? translateY : 0
    
    //2️⃣做出判断后，把歌词放到“歌词面板”的中央；
    this.$(".panel-lyrics .container").style.transform = `translateY(-${translateY}px)`
    
    //3️⃣歌词“高亮”的设置：
    this.$$(".panel-lyrics p").forEach(node => node.classList.remove("current"))
    node.classList.add("current")
  }

  bind() {
    let self = this

    /*6️⃣页面上有很多“点击事件”，只有“点击”了相关按钮，页面才会有相应的反应。
    故需要一个“绑定 bind”方法；*/

    /*7️⃣当用户点击任何一个按钮时，播放器的运行逻辑都是：先“缓存”对应歌曲的信息，然后“播放”该歌曲；*/
    // this.$(".btn-play-pause").onclick = function () {
    //     self.playSong()
    //     console.log('a')
    // }
    // self.loadSong()
    //   self.playSong()
    this.$(".btn-play-pause").onclick = function () {
      if (this.classList.contains("playing")) {
        self.audio.pause()  //把音乐暂停掉

        this.classList.remove("playing")  //移除 playing
        this.classList.add("pause")  //添加 pause

        this.querySelector("use").setAttribute("xlink:href", "#icon-play")
      } else if (this.classList.contains("pause")) {
        self.audio.play()

        this.classList.remove("pause")  //移除 pause
        this.classList.add("playing")  //添加 playing

        this.querySelector("use").setAttribute("xlink:href", "#icon-pause")
      }
    }
    this.$(".btn-pre").onclick = function () {
      console.log("pre")
      self.currentIndex = (self.currentIndex - 1 + self.songList.length) % self.songList.length
      self.loadSong()
      self.playSong()
    }

    this.$(".btn-next").onclick = function () {
      self.currentIndex = (self.currentIndex + 1) % self.songList.length
      self.loadSong()
      self.playSong()
    }
    let swiper = new Swiper(this.$(".panels"))
    swiper.on("swipLeft", function () {
      this.classList.remove("panel1")  //往左滑动
      this.classList.add("panel2")

      console.log("left")
    })

    swiper.on("swipRight", function () {
      this.classList.remove("panel2")  //往右滑动
      this.classList.add("panel1")

      console.log("right")
    })
    this.audio.ontimeupdate = function() {
      self.locateLyric()
      
      //同时还会设置“播放进度条”，我们一并在这里调用。
      self.setProgressBar()
    }
    
  }

  playSong() {
    //8️⃣这个方法专门用于“播放”音乐；
    this.audio.oncanplaythrough = () => this.audio.play()
  }

  setProgressBar() {
    console.log("set setProgressBar")

    let percent = (this.audio.currentTime * 100 /this.audio.duration) + "%"
    
    console.log(percent)

    this.$(".bar .progress").style.width = percent

    this.$(".time-start").innerText = this.formateTime(this.audio.currentTime)

    console.log(this.$(".bar .progress").style.width)
  }


  formateTime(secondsTotal) {
    let minutes = parseInt(secondsTotal/60)
    minutes = minutes >= 10 ? "" + minutes : "0" + minutes
    
    let seconds = parseInt(secondsTotal%60)
    seconds = seconds >= 10 ? "" + seconds : "0" + seconds
    
    return minutes + ":" + seconds
  }


  /*9️⃣以上，我们算是将音乐播放起来了。
  但“歌词”还有很多需要实现的效果：如歌词的缓存、定位等。
  随着项目的进行，我们再一一处理。*/

}
window.p = new Player("#player")
