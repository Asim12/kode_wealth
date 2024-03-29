const AWS = require('aws-sdk');
const fs = require('fs');
const { createVideo, updateVideoDoc, addfourEightyVideo } = require('./services/video');
const s3 = new AWS.S3({
    accessKeyId: 'AKIASEFUKFQSHPKCECZE',
    secretAccessKey: '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'
});
const crypto = require("crypto");


const BUCKET_NAME = 'botafoga-videos';







const s3Uploading = async (videoPath, videoName, user_id, quality, videoStatus) => {
    console.log(`UPLOADING.............${quality}`)
    
    const fileContent = fs.readFileSync(videoPath);


    const params = {
        Bucket: BUCKET_NAME,
        Key: videoStatus == "mainVideo" ? `-${quality}-${videoName}` : videoName,
        Body: fileContent
    };


    try {

        let aws = await s3.upload(params).promise()
        console.log("🚀 ~ file: s3uploadVideo.js ~ line 40 ~ s3Uploading ~ aws", aws.Location.split("amazonaws.com/")[1])
        // let url  = aws.Location.split("amazonaws.com/")[1]
        // return

        let videoObj = {
            userId: user_id,
            originalVideo: videoStatus == "mainVideo" ? aws.Location : aws.Location,
        }



        return videoObj


    } catch (error) {

        console.log("🚀 ~ file: s3uploadVideo.js ~ line 48 ~ s3Uploading ~ error", error)
    }

}


const s3UploadingThumbnails = async (thumbnailPath, thumbnailName, user_id, quality, videoStatus) => {
    console.log(`UPLOADING.............${quality}`)
    const randomNumber = crypto.randomInt(0, 1000000);



    const fileContent = fs.readFileSync(thumbnailPath);


    const params = {
        Bucket: 'botafoga-thumbnails',
        Key: randomNumber + thumbnailName,
        Body: fileContent
    };


    try {

        let aws = await s3.upload(params).promise()
        console.log("🚀 ~ file: s3uploadVideo.js ~ line 40 ~ s3Uploading ~ aws", aws)

       return aws.Location;


    } catch (error) {

        console.log("🚀 ~ file: s3uploadVideo.js ~ line 48 ~ s3Uploading ~ error", error)
    }

}



module.exports = { s3Uploading,s3UploadingThumbnails }