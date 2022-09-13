const Sauce = require("../models/sauce");
const fs = require("fs");

exports.createSauce = (req, res) => {
    const sauceObject = JSON.parse(req.body.sauce);
    const sauce = new Sauce({
        ...sauceObject,
        imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`,
        likes: 0,
        dislikes: 0,
        usersLiked: [],
        usersDisliked: []
    });
    sauce.save()
        .then(() => res.status(201).json({ message: "Sauce ajoutée !" }))
        .catch(error => res.status(400).json({ error }));
};

exports.getAllSauce = (req, res) => {
    Sauce.find()
        .then(sauce => {
            res.status(200).json(sauce);
        })
        .catch(error => {
            res.status(404).json({ error })
        });
};

exports.getOneSauce = (req, res) => {
    Sauce.findOne({ _id: req.params.id })
        .then(sauce => {
            res.status(200).json(sauce);
        })
        .catch(error => res.status(404).json({ error }));
};

exports.updateSauce = (req, res, next) => {
    Sauce.findOne({ _id: req.params.id }).then((sauce) => {
        const filename = sauce.imageUrl.split("/images/")[1];
        fs.unlink(`images/${filename}`, () => {
            if (sauce.userId === req.auth.userId) {
                sauceObject = {
                    ...JSON.parse(req.body.sauce),
                    imageUrl: `${req.protocol}://${req.get("host")}/images/${
                    req.file.filename
                    }`,
                };
            } else {
                    sauceObject = { ...req.body };
            }
            if (sauce.userId === req.auth.userId) {
                Sauce.updateOne({ _id: req.params.id}, { ...sauceObject, _id: req.params.id })
                .then(() => res.status(200).json({ message: "Sauce modifiée !" }))
                .catch((error) => res.status(400).json({ error }));
            } else {
                next();
            }
        });
    }) .catch((error) => res.status(400).json({ error }));
};

exports.deleteSauce = (req, res, next) => {
    Sauce.findOne({ _id: req.params.id})
        .then((sauce) => {
            if (sauce.userId === req.auth.userId) {
                const fileName = sauce.imageUrl.split('/images/')[1];
                fs.unlink(`images/${fileName}`, () => {
                    sauce.deleteOne({ _id: req.params.id })
                        .then(() => res.status(200).json({ message: "Sauce supprimée !" }))
                        .catch((error) => res.status(400).json({ error }));
                });
            } else {
                next();
            }
        })
        .catch((error) => res.status(400).json({ error }))
};

exports.likeSauce = (req, res, next) => {
    const userId = req.body.userId;
    const sauceId = req.params.id;
    const likeTable = req.body.like;

    if (likeTable === 1) {
        Sauce.findOne({ _id: sauceId })
            .then(sauce => {
                if (!sauce.usersLiked.includes(userId)) {
                    Sauce.updateOne({ _id: sauceId }, { $inc: { likes: likeTable }, $push: { usersLiked: userId } })
                        .then(() => res.status(200).json({ message: "Like ajouté à la sauce" }))
                        .catch((error) => res.status(400).json({ error }));
                } else {
                    next();
                }
            }).catch(error => res.status(400).json({ error }));
    } else if (likeTable === 0) {
        Sauce.findOne({ _id: sauceId })
            .then(sauce => {
                if (sauce.usersLiked.includes(userId)) {
                    Sauce.updateOne({ _id: sauceId }, { $inc: { likes: -1 }, $pull: { usersLiked: userId } })
                        .then(() => res.status(200).json({ message: "Retire votre like !" }))
                        .catch(error => res.status(400).json({ error }));
                } else if (sauce.usersDisliked.includes(userId)) {
                    Sauce.updateOne({ _id: sauceId }, { $inc: { dislikes: -1 }, $pull: { usersDisliked: userId } })
                        .then(() => res.status(200).json({ message: "Retire votre dislike !" }))
                        .catch(error => res.status(400).json({ error }));
                }
        })
        .catch(error => res.status(400).json({ error }));
    }else if (likeTable === -1) {
        Sauce.findOne({ _id: sauceId })
            .then(sauce => {
                if (!sauce.usersDisliked.includes(userId)) {
                    Sauce.updateOne({ _id: sauceId }, { $inc: { dislikes: -1 * likeTable }, $push: { usersDisliked: userId } })
                    .then(() => res.status(200).json({ message: "dislike ajouté à la sauce" }))
                    .catch((error) => res.status(400).json({ error }));
                } else {
                    next();
                }
        }).catch(error => res.status(400).json({ error }));
    } else {
        console.log("Erreur");
        next();
    }
}