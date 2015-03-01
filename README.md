# Omnus

offline mobile music streaming

# Omnus

An offline mobile music streaming service in Node.js.


## How?

1. Accepts song selection input via SMS (ex: 'fireworks by katy perry')
2. Searches on YouTube and grabs URL of first result
3. Downloads media source, stripping all but audio
4. Streams MP3 over returned call to initiator


## Why?

I'm in the process of transitioning away from PHP to Ruby.  I have come to find
PHP's lack of a real REPL to be frustrating and was not able to find an existing
implementation that was complete.  Boris weighs in at a few hundred lines of
fairly straightforward code.

