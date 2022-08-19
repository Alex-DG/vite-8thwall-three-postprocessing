attribute vec3 center;

varying vec3 vCenter;
    
void main() {
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); 
    
    vCenter = center;
}