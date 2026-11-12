'use strict';
// D04-only read-only WebM evidence; placeholder for test-first regression.
// No decoder result may be promoted into physical impact/sample synchrony.
function inspectRealWebMVideoPTS(_media={}) {
 return {source:'d04-ebml-video-pts',status:'UNIMPLEMENTED',sampleSynchronized:false};
}
function classifyEncodedFrameYield(_media={},_parsed={}) {
 return 'ENCODED_FRAME_TIMING_UNVERIFIED';
}
module.exports={inspectRealWebMVideoPTS,classifyEncodedFrameYield};
