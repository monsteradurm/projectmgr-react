import { useEffect, useRef, useState } from "react";
import { BoxService } from "../../Services/Box.service";
import ReactPlayer from 'react-player'
import { Pannellum, PannellumVideo } from "pannellum-react";
const VideoSphere = ({ src, size = 500 }) => {
    const [video] = useState(() => {
      const el = document.createElement('video')
      el.src = "./Stitch.mp4"
      el.crossOrigin = 'Anonymous'
      el.autoplay=true
      return el
    })

    return <mesh scale={[-size, size, size]}>
      <sphereGeometry/>
      <meshBasicMaterial side={BackSide}>
        <videoTexture attach="map" args={[video]}/>
      </meshBasicMaterial>
    </mesh>
  }

export const PanoramicVideo = ({url}) => {
    const container = useRef();

    return  <PannellumVideo
    video={url}
        loop
        width="100%"
        height="600px"
        pitch={10}
        yaw={180}
        hfov={140}
        minHfov={50}
        maxHfov={180}
    />
}