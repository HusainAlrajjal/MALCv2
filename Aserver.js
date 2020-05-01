//const request = require('request');
const fetch = require('node-fetch');
const express = require('express');
var bodyParser = require("body-parser");
var fs = require('fs');
const app = express();
var fetchedF = false;
var fetchedS = false;
var port = 3000;

var queue = require('express-queue');
const queueMw = queue({ activeLimit: 1, queuedLimit: -1 });
//app.use(queueMw);


const DATABASE_NAME = 'MALC';
const DATABASE_URL = 'mongodb://127.0.0.1:27017/MALC';

var mongoose = require('mongoose');
mongoose.connect(DATABASE_URL);

var compare_schema = new mongoose.Schema({
    user1: String,
    user2: String,
    list: [{
        title: String,
        score1: Number,
        score2: Number,
        status1: String,
        status2: String,
        episodes: Number,
        Img_url: String,
        url: String,
        Mutual: Boolean

    }]
})


var statistics = new mongoose.Schema({
    title: String,
    Img_url: String,
    url: String,
    episodes: Number,
    count: Number
})


var statistics_collection = mongoose.model("statistics", statistics, "statistics");
var compare_collection = mongoose.model("compare", compare_schema, "compare");
app.use('/imgs', express.static(__dirname + "/imgs"));
app.use('/css', express.static(__dirname + "/css"));
app.use('/css2', express.static(__dirname + "/css2"));

//app.use('/index', express.static(__dirname + "/views"));




//app.use(express.static("public"));
app.use(bodyParser.urlencoded({
    extended: true
}));

app.listen(port, function() {
    console.log(`Server is running at port ${port}`);
});

app.get("/", function(req, res) {
    res.render("\index.ejs")
})
app.get("/MostCommon", async function(req, res) {

    var top = await show_statistics_ranked("-count", res, true);
})
app.get("/rarest", async function(req, res) {

    var bottom = await show_statistics_ranked("count", res, false);
})

//[[name, name2,compare_list,],compid];
app.get("/:id", async function(req, res) {
    var id = req.params.id;
    var myresponse = []
    await compare_collection.findOne({ _id: id }, function(err, mycomparision) {
        if (err) return err

        myresponse.push(mycomparision.user1)
        myresponse.push(mycomparision.user2)
        myresponse.push(mycomparision.list)
    })

    res.render("\compare.ejs", {
        compared: myresponse,
        compid: id
    })
})

app.post("/compare", queueMw, async function(req, res) {
    queueMw.queue.getLength()
    var user1 = req.body.user1;
    var user2 = req.body.user2;
    var allanimes = await getAllAnimes(user1, user2, res);
    console.log("test after finishing")
    console.log(` requests in queue${queueMw.queue.getLength()}`)
});


async function getAllAnimes(name, name2, res) {



    var animes1 = [

    ];

    var animes2 = [


    ];

    var animelist = animes1;

    var page = 1;
    var name1 = name;


    var fetchNow = await

    function(nameU) {
        fetch(`https://api.jikan.moe/v3/user/${nameU}/animelist/all/${page}`)
            .then((response) => {
                // fetched = true;
                // setTimeout(() => {
                //     fetched = false;

                // }, 5000);
                return response.json();
            })
            .then(async(data) => {
                var length = data.anime.length;
                console.log(length);
                if (length == 0) {
                    //console.log("Finished fetching... waited 5 seconds")
                    // setTimeout(() => {

                    //}, 5000);




                    fetchedF = true;

                    if (fetchedF == true && fetchedS == false) {
                        console.log("-------------------------------- calling the second user --------------------------");
                        page = 1;
                        name1 = name2;
                        animelist = animes2;
                        setTimeout(async function() {

                            await fetchNow(name1);
                        }, 4000);


                        fetchedS = true;
                    } else if (fetchedF == true && fetchedS == true) {
                        fetchedS = false;
                        fetchedF = false;
                        //                    console.log(animes1)
                        console.log("testsehtuwerugifqhwerugh qwure")
                            //                    console.log(animes2)
                            // comparing function 

                        compare_results = await compare_list(animes1, animes2, name, name2);
                        //[[name, name2,compare_list,],compid];
                        compare_result = compare_results[0]
                        compid = compare_results[1]
                        console.log("compared");
                        console.log(` requests in queue${queueMw.queue.getLength()}`)

                        // COMPARED
                        //                    res.redirect("/Layout.html")
                        res.render("\compare.ejs", {
                            compared: compare_result,
                            compid: compid
                        })
                    }

                    fs.writeFile(`anime_${nameU}.json`, JSON.stringify(animelist), function(err) {
                        if (err) return console.log(err);
                    })


                } else {
                    for (var i = 0; i < length; i++) {

                        var myanime = {
                            title: data.anime[i].title,
                            image_url: data.anime[i].image_url,
                            watching_status: data.anime[i].watching_status,
                            total_episodes: data.anime[i].total_episodes,
                            score: data.anime[i].score,
                            url: data.anime[i].url
                        };

                        animelist.push(myanime)

                    }
                    console.log("inner")
                    page++;
                    setTimeout(async function() {
                        await fetchNow(name1);
                    }, 4000);


                }



            });


    }
    // if (fetched == false){
    //     fetchNow();
    // } else {
    //     setTimeout(() => {
    //         fetchNow();

    //     }, 5000);
    //}
    await fetchNow(name1);
    console.log("test after")
}



function compareValues(key, order = 'asc') {
    return function innerSort(a, b) {
        if (!a.hasOwnProperty(key) || !b.hasOwnProperty(key)) {
            return 0;
        }

        const varA = (typeof a[key] === 'string') ?
            a[key].toUpperCase() : a[key];
        const varB = (typeof b[key] === 'string') ?
            b[key].toUpperCase() : b[key];

        let comparison = 0;
        if (varA > varB) {
            comparison = 1;
        } else if (varA < varB) {
            comparison = -1;
        }
        return (
            (order === 'desc') ? (comparison * -1) : comparison
        );
    };
}

async function compare_list(user1_list_json, user2_list_json, name, name2) {
    var user1_list = user1_list_json;
    var user2_list = user2_list_json;
    //lists reading
    user1_list = user1_list.sort(compareValues('title', 'asc'));
    user2_list = user2_list.sort(compareValues('title', 'asc'));

    //the main list that will contain the required data for saving in the database
    var compare_list = [];

    console.log("hit")
    console.log(compare_list)

    var i = 0;

    //start with list 1, read all animes, check if there is a match in the list 2
    for (i = 0; i < user1_list.length; i++) {
        //retrive main info 
        var item = new Object();
        item.title = user1_list[i].title;
        item.Img_url = user1_list[i].image_url;
        item.url = user1_list[i].url;
        item.episodes = user1_list[i].total_episodes;


        //these info is for comparison
        item.score1 = user1_list[i].score;
        item.status1 = user1_list[i].watching_status;
        item.score2 = 0;
        item.status2 = "Not Listed";
        item.Mutual = false;
        //note: there are because we assu in the begining that there is no match

        //here we check for the match and update the values
        var j = 0
        for (j = 0; j < user2_list.length; j++) {
            if (item.title == user2_list[j].title) {
                item.score2 = user2_list[j].score;
                item.status2 = user2_list[j].watching_status;
                item.Mutual = true;
                // delete this topic from the other list because we dont need it again
                user2_list.splice(j, 1);
                break;
            }
        }
        //append the this item to the comparison list
        compare_list.push(item);

    }
    //read all animes from list 2, no need to check if there is a match in the list 1 because any match is deleted before
    for (i = 0; i < user2_list.length; i++) {
        var item = new Object();
        item.title = user2_list[i].title;
        item.Img_url = user2_list[i].image_url;
        item.url = user2_list[i].url;
        item.episodes = user2_list[i].total_episodes;

        item.score1 = 0;
        item.status1 = "Not Listed";
        item.score2 = user2_list[i].score;
        item.status2 = user2_list[i].watching_status;
        item.Mutual = false;
        compare_list.push(item);
        //        console.log("in")
        //        console.log(compare_list[0])

    }
    var newcomp = new compare_collection({
        user1: name,
        user2: name2,
        list: compare_list
    })
    var compid;
    newcomp.save(await
        function(err, topic) {
            if (err) console.log(err)
            compid = topic._id;
        });

    //    await update_statisitcs_inDB(compare_list);
    //------------------------------------------------------
    anime_new_cmparison_list = compare_list
    if (anime_new_cmparison_list.length != 0) {
        var i = 0;
        for (i = 0; i < anime_new_cmparison_list.length; i++) {
            var anime = new statistics_collection({
                title: anime_new_cmparison_list[i].title,
                Img_url: anime_new_cmparison_list[i].Img_url,
                url: anime_new_cmparison_list[i].url,
                episodes: Number(anime_new_cmparison_list[i].episodes),
                count: 1
            });
            // check if there is a visit with the same titile
            await statistics_collection.findOne({
                title: anime.title,
            }, async function(err, topic) {
                if (err) console.log(err);
                else {
                    if (topic != null) {
                        newcount = topic.count + 1;
                        await statistics_collection.updateOne({
                            title: anime.title
                        }, {
                            Img_url: anime.Img_url,
                            url: anime.url,
                            episodes: Number(anime.episodes),
                            count: newcount
                        }, function(err) {
                            if (err) return console.error(err);
                        })

                    } else {
                        setTimeout(() => {
                            anime.save(
                                function(err, topic) {
                                    if (err) console.log(err)
                                });
                        }, 5000);


                    }
                }
            });

        }
        console.log("at the second")

        console.log("at the first")
            //        console.log(compare_list[0])

        return [
            [name, name2, compare_list, ], compid
        ];
    } else {

        return;
    }




    //-----------------------------------------------------




}

async function update_statisitcs_inDB(anime_new_cmparison_list) {
    if (anime_new_cmparison_list.length != 0) {
        var i = 0;
        for (i = 0; i < anime_new_cmparison_list.length; i++) {
            var anime = new statistics_collection({
                title: anime_new_cmparison_list[i].title,
                Img_url: anime_new_cmparison_list[i].Img_url,
                url: anime_new_cmparison_list[i].url,
                episodes: Number(anime_new_cmparison_list[i].episodes),
                count: 1
            });
            // check if there is a visit with the same titile
            await statistics_collection.findOne({
                title: anime.title,
            }, function(err, topic) {
                if (err) console.log(err);
                else {
                    newcount = topic.count + 1;
                    statistics_collection.updateOne({
                        title: anime.title
                    }, {
                        Img_url: anime.Img_url,
                        url: anime.url,
                        episodes: Number(anime.episodes),
                        count: newcount
                    }, function(err) {
                        if (err) return console.error(err);
                    });
                }
            });
        }

    }
    console.log("at the second")



    return;
}


async function show_statistics_ranked(key, res, comm) {
    var animes

    // -count = descending
    // count = ascending 
    //retrive statistics
    await statistics_collection.find({}).sort(`${key}`).exec(await
        function(err, topanimes) {

            animes = topanimes;
            var output_list = [];
            var i = 0;
            //to return at most 20 records
            for (i = 0; i < animes.length && i < 20; i++) {
                output_list.push(animes[i]);
            }

            res.render("\stats.ejs", { top: output_list, common: comm })
            return output_list;
        })



}