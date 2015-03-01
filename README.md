# Omnus

offline mobile music streaming

# Omnus

An offline mobile music streaming service in Node.js.


## How?

Here's a step-by-step overview:

1. Accepts song selection input via SMS (ex: 'fireworks by katy perry')
2. Searches on YouTube and grabs URL of first result
3. Downloads media source, stripping all but audio
4. Streams MP3 over returned call to initiator

What does what?

* SMS and phone calling done - [Twilio]
* YouTube searches - [YouTube API]
* YouTube downloads - [youtube-dl] 
* MP4 -> MP3 - [FFmpeg]
* API Server - [express]


## Why?

With mobile data being so expensive, I wanted to create a workaround to listen to music. I have come to realize that [Twilio's voice pricing] so expensive, it's not a practical solution to release (even in a SaaS model). That said, it's still pretty freaking amazing that you can mimic the functionality of an [Rdio](http://www.rdio.com/home/en-us/) or [Spotify](https://www.spotify.com/us/) MVP without internet in under 100 lines of code.


[Twilio]: https://www.twilio.com
[YouTube API]: https://developers.google.com/youtube/v3/docs
[youtube-dl]: http://rg3.github.io/youtube-dl
[FFmpeg]: https://www.ffmpeg.org
[express]: http://expressjs.com
[Twilio's voice pricing]: https://www.twilio.com/voice/pricing
