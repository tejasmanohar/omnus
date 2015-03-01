# Omnus

An offline mobile music streaming server.


## How?

Here's a step-by-step overview:

1. Accepts song selection input via SMS (ex: 'fireworks by katy perry')
2. Searches on YouTube and grabs URL of first result
3. Downloads media source, stripping all but audio
4. Streams MP3 over returned call to initiator

So... how does all that work?

* SMS and phone calling done - [Twilio]
* YouTube searches - [YouTube API]
* YouTube downloads - [youtube-dl] 
* MP4 to MP3 - [FFmpeg]
* API Server - [express]

For more details, use the [source], Luke ;)


## Installation

Clone the repo, and navigate to your local copy:

    git clone https://github.com/tejasmanohar/omnus.git && cd omnus

Install dependencies:

    npm install


## Usage

Expose your routes with a public web address. I use [ngrok]:

    ngrok 3000

Make an account with [Twilio], register a phone number, and set the domain + `/receive` (ex: [http://example.ngrok/receive](http://example.ngrok/receive)) as the
> Messaging Request URL w/ HTTP POST setting.

![Twilio Screenshot](http://i.imgur.com/3XPeI4T.png)

Source the following variables in your environment (with real information)

    TWILIO_AUTH_SID=XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    TWILIO_AUTH_TOKEN=XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    PHONE_NUMBER=+XXXXXXXX
    BASE_URL=example.ngrok.com

Start the server:

    node app.js

Use it, hack it, share it!


## Why?

With mobile data being so expensive, I wanted to create a workaround to listen to music. I have come to realize that [Twilio's voice pricing] so expensive, it's not a practical solution to release (even in a SaaS model). That said, it's still pretty freaking amazing that you can mimic the functionality of an [Rdio](http://www.rdio.com/home/en-us/) or [Spotify](https://www.spotify.com/us/) MVP without internet in under 100 lines of code.


## License

Omnus is Copyright 2015 Tejas Manohar.

Licensed under the **[MIT License] [license]**.


[Twilio]: https://www.twilio.com
[YouTube API]: https://developers.google.com/youtube/v3/docs
[youtube-dl]: http://rg3.github.io/youtube-dl
[FFmpeg]: https://www.ffmpeg.org
[express]: http://expressjs.com
[source]: https://github.com/tejasmanohar/omnus/blob/master/app.js
[Twilio's voice pricing]: https://www.twilio.com/voice/pricing
[license]: https://github.com/tejasmanohar/omnus/blob/master/LICENSE
