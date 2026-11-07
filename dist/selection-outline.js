import * as THREE from 'three';

// Render only the pixels outside the selected part; its own materials stay intact.
export function createSelectionOutline(renderer){
  const maskScene=new THREE.Scene();
  maskScene.overrideMaterial=new THREE.MeshBasicMaterial({color:0xffffff,side:THREE.DoubleSide,toneMapped:false});
  const target=new THREE.WebGLRenderTarget(1,1,{minFilter:THREE.LinearFilter,magFilter:THREE.LinearFilter,depthBuffer:true});
  const material=new THREE.ShaderMaterial({
    transparent:true,depthTest:false,depthWrite:false,toneMapped:false,
    uniforms:{mask:{value:target.texture},stepSize:{value:new THREE.Vector2()},outlineColor:{value:new THREE.Color()}},
    vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.0,1.0);}',
    fragmentShader:`
      uniform sampler2D mask;
      uniform vec2 stepSize;
      uniform vec3 outlineColor;
      varying vec2 vUv;
      void main(){
        float inside=texture2D(mask,vUv).a;
        float nearby=0.0;
        for(int i=0;i<16;i++){
          float angle=float(i)*6.28318530718/16.0;
          nearby=max(nearby,texture2D(mask,vUv+vec2(cos(angle),sin(angle))*stepSize).a);
        }
        float edge=smoothstep(0.05,0.85,nearby)*(1.0-inside);
        if(edge<0.01)discard;
        gl_FragColor=vec4(outlineColor,edge);
        #include <colorspace_fragment>
      }`
  });
  const overlay=new THREE.Scene();overlay.add(new THREE.Mesh(new THREE.PlaneGeometry(2,2),material));
  const overlayCamera=new THREE.Camera(),size=new THREE.Vector2(),clearColor=new THREE.Color();
  let source=null,proxy=null;
  return {
    render(part,camera,color){
      if(!part)return;
      if(source!==part){source=part;maskScene.clear();proxy=part.clone(true);proxy.matrixAutoUpdate=false;proxy.visible=true;maskScene.add(proxy);}
      part.updateWorldMatrix(true,true);proxy.matrix.copy(part.matrixWorld);
      renderer.getDrawingBufferSize(size);
      if(target.width!==size.x||target.height!==size.y)target.setSize(size.x,size.y);
      const width=3*renderer.getPixelRatio();material.uniforms.stepSize.value.set(width/size.x,width/size.y);material.uniforms.outlineColor.value.set(color);
      renderer.getClearColor(clearColor);const alpha=renderer.getClearAlpha(),autoClear=renderer.autoClear;
      renderer.setRenderTarget(target);renderer.setClearColor(0x000000,0);renderer.autoClear=true;renderer.render(maskScene,camera);
      renderer.setRenderTarget(null);renderer.setClearColor(clearColor,alpha);renderer.autoClear=false;renderer.render(overlay,overlayCamera);renderer.autoClear=autoClear;
    }
  };
}
