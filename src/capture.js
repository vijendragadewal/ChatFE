export const capture = async () => {
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')
  const video = document.createElement('video')
  try {
    const captureStream = await navigator.mediaDevices.getDisplayMedia()
    video.srcObject = captureStream
    context.drawImage(video, 0, 0, window.innerWidth, window.innerHeight)
    captureStream.getTracks().forEach(track => track.stop())
    return canvas.toDataURL('test/png')
  } catch (err) {
    console.log(err)
  }
}

export const takeScreenShare = async () => {
  try {
    return await navigator.mediaDevices.getDisplayMedia()
  } catch (err) {
    console.log(err)
  }
}