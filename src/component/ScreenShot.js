export const takescreenshot = async () => {
  if (navigator.mediaDevices.getDisplayMedia) {
    console.log('take Screenshot')
    const media = await navigator.mediaDevices.getDisplayMedia({
      video: { mediaSource: 'screen', preferCurrentTab: true }
    })
    const track = media.getVideoTracks()[0]
    const imageCapture = new ImageCapture(track)
    const bitmap = await imageCapture.grabFrame()
    track.stop()

    console.log('bitmap', bitmap)
    const canvas = document.getElementById('canvasImg')

    canvas.width = 700
    canvas.height = 500

    const context = canvas.getContext('2d')
    context.drawImage(bitmap, 0, 0, 700, 500)
    const image = canvas.toDataURL()

    const res = await fetch(image)
    const buff = await res.arrayBuffer()

    // const file = [new File([buff], `photo_${new Date()}.jpg`, { type: 'image/jpg' })]
    return image
  }
}