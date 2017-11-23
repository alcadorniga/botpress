// var CsvHelper = require('./csvHelper.js');
const _ = require('lodash');
const events = require('events');
const eventEmitter = new events.EventEmitter();

module.exports = function(bp) {

    bp.middlewares.load()

    const utterances = {
        start: /hello|hi|hey|holla/i,
        good: /good|great|fine|okay|ok/i,
        bad: /bad|sad|not good|not great/i,
        end: /exit|bye|goodbye/i,
        stop: /stop|cancel|abort/i,
        agree: /yes|yeah|okay|sure|ok|you can|yep|alright|go ahead/i,
        disagree: /no|nope|no thank you|no thanks|none/i
    }

    const replies = {
        accepted: () => _.sample(['Great!', 'Nice to hear that!']),
        acknowledge: () => _.sample(['Great!', 'Okay', 'Thanks!']),
        sorry: () => _.sample(['So sorry to hear that']),
        unknown: () => _.sample(['I do not know what you are talking about...', 'Try something else.', 'I am not quite sure if I understand..'])
    }

    bp.hear(utterances.stop, (event, next) => {
        const convo = bp.convo.find(event)
        convo && convo.stop('aborted')
    })


    bp.hear(utterances.start, event => {
        const txt = txt => bp.messenger.createText(event.user.id, txt)

        bp.convo.start(event, convo => {
            convo.threads['default'].addMessage(txt('Hello! This is a sample bot.'))
            convo.threads['default'].addQuestion(txt('How are you today?'), [{
                    pattern: utterances.good,
                    callback: () => {
                        convo.set('feeling', 'good')
                        convo.say(txt(replies.accepted()))
                        convo.switchTo('name')
                    }
                },
                {
                    pattern: utterances.bad,
                    callback: () => {
                        convo.set('feeling', 'bad')
                        convo.say(txt(replies.sorry()))
                        convo.say(txt('Anyway..'))
                        convo.switchTo('name')
                    }
                },
                {
                    default: true,
                    callback: () => {
                        convo.say(txt(replies.unknown()))
                        convo.repeat()
                    }

                }
            ])

            convo.createThread('name')
            convo.threads['name'].addQuestion(txt('What is your name?'), [{
                    pattern: /(\w+)/i,
                    callback: (response) => {
                        convo.set('name', response.match)
                        convo.say(txt('Hello, ' + response.match))
                        options = {
                            quick_replies: [{
                                title: 'location',
                                content_type: 'location'
                            }],
                            typing: true,
                            waitRead: true
                        }

                        bp.messenger.sendText(event.user.id, 'Please press the button to give your location', options)

                        bp.hear({ type: 'location' }, (event, next) => {
                            convo.switchTo('pizza');
                        })
                    }
                },
                {
                    default: true,
                    callback: () => {
                        convo.say(txt('Please enter your name'))
                        convo.repeat()
                    }
                }
            ])


            convo.createThread('pizza')
            convo.threads['pizza'].addQuestion(txt('We have a few options available'), [{
                callback: (response) => {
                    bp.messenger.sendTemplate(event.user.id, {
                        template_type: 'button',
                        text: 'What would you have?',
                        buttons: [{
                                type: 'postback',
                                title: 'Hawaiian',
                                payload: 'HITL_STOP'
                            },
                            {
                                type: 'postback',
                                title: 'Pepperoni',
                                payload: 'HITL_STOP'
                            },
                            {
                                type: 'postback',
                                title: 'Bacon',
                                payload: 'HITL_STOP'
                            }
                        ]
                    })

                    bp.notifications.send({
                        message: 'You added ' + event.text,
                        level: 'info',
                        url: '/modules/botpress-hitl'
                    })
                    //bp.hitl.pause(event.platform, event.user.id)


                    bp.hear(/HITL_STOP/, (event, next) => {
                        bp.messenger.sendText(event.user.id, 'Human in the loop disabled. Bot resumed.')
                        bp.hitl.unpause(event.platform, event.user.id)
                    })

                    bp.hear({ type: 'message', text: /.+/i }, (event, next) => {
                        bp.messenger.sendText(event.user.id, 'You said: ' + event.text)
                        //convo.switchTo('topping');
                    })
                }
            }])

            // bp.hear({
            //     type: 'postback',
            //     text: 'Hawaiian'
            // }, (event, next) => {
            //     bp.messenger.sendText(event.user.id, 'You chose: Hawaiian', {typing: true})
            // },
            // {
            //     type: 'postback',
            //     text: 'Pepperoni'
            // }, (event, next) => {
            //     bp.messenger.sendText(event.user.id, 'You chose: Pepperoni', {typing: true})
            // },
            // {
            //     type: 'postback',
            //     text: 'Bacon'
            // }, (event, next) => {
            //     bp.messenger.sendText(event.user.id, 'You chose: Bacon', {typing: true})
            // }
            // })


            // convo.createThread('topping')
            // convo.threads['topping'].addQuestion(txt('Would you like to add additional toppings?'), [{
            //         pattern: utterances.agree,
            //         callback: (response) => {
            //             convo.switchTo('addToppings')
            //         }
            //     },
            //     {
            //         pattern: utterances.disagree,
            //         callback: (response) => {
            //             convo.say(txt('No additional toppings.'))
            //             convo.switchTo('size')
            //         }
            //     },
            //     {
            //         default: true,
            //         callback: () => {
            //             convo.say(txt('Please enter a number from the choices'))
            //             convo.repeat()
            //         }
            //     }
            // ])

            // convo.createThread('addToppings')
            // convo.threads['addToppings'].addQuestion(txt('We have a few toppings available'), [{
            //     pattern: /choices/i,
            //     callback: (response) => {
            //         bp.messenger.sendTemplate(event.user.id, {
            //             template_type: 'button',
            //             text: 'Which would you add?',
            //             buttons: [{
            //                     type: 'postback',
            //                     title: 'Extra cheese',
            //                     payload: 'HITL_STOP'
            //                 },
            //                 {
            //                     type: 'postback',
            //                     title: 'Anchovy',
            //                     payload: 'HITL_STOP'
            //                 },
            //                 {
            //                     type: 'postback',
            //                     title: 'Ham',
            //                     payload: 'HITL_STOP'
            //                 }
            //             ]
            //         })

            //         bp.notifications.send({
            //             message: 'You added ' + event.text,
            //             level: 'info',
            //             url: '/modules/botpress-hitl'
            //         })
            //         bp.hitl.pause(event.platform, event.user.id)


            //         bp.hear(/HITL_STOP/, (event, next) => {
            //             bp.messenger.sendText(event.user.id, 'Human in the loop disabled. Bot resumed.')
            //             bp.hitl.unpause(event.platform, event.user.id)
            //         })

            //         bp.hear({ type: 'message', text: /.+/i }, (event, next) => {
            //             bp.messenger.sendText(event.user.id, 'You added: ' + event.text)
            //             convo.switchTo('topping');
            //         })
            //     }
            // }])


            convo.createThread('size')
            convo.threads['size'].addMessage(txt('Your chosen pizza is available in:\n1 Single\n2 Large\n3 Family'))
            convo.threads['size'].addQuestion(txt('What size would you be having?'), [{
                    pattern: /[123]/,
                    callback: (response) => {
                        sizes = [
                            { id: 1, label: "Single" },
                            { id: 2, label: "Large" },
                            { id: 3, label: "Family" }
                        ]

                        if (response.text) {
                            sizeID = response.text;
                            chosenSize = sizes.filter(function(size) { return size.id == sizeID })[0];
                            sizeType = chosenSize.label;
                            orderSize = sizeType;
                            convo.set('size', orderSize)
                            convo.say(txt('You have chosen ' + orderSize))
                            convo.stop('receipt')
                        }
                    }
                },
                {
                    default: true,
                    callback: () => {
                        convo.say(txt('Please enter a number from the choices'))
                        convo.repeat()
                    }
                }
            ])

            convo.on('receipt', () => {
                convo.say(txt('Thanks for the info! Let me repeat everything'))
                convo.say(txt(`So you are having a ${convo.get('size')} size ${convo.get('pizza')} pizza with ${convo.get('addToppings')}`))
                convo.say(txt(`Billing to\nName: ${convo.get('name')}\nAddress: ${convo.get('address')}`))
            })

            convo.on('aborted', () => {
                convo.say(txt('You are now leaving. Bye!'))
            })
        })
    })
}

// convo.createThread('else')
// convo.threads['else'].addQuestion(txt('Anything else?'), [{
//         pattern: utterances.agree,
//         callback: (response) => {
//             convo.switchTo('pizza')
//         }
//     },
//     {
//         pattern: utterances.disagree,
//         callback: (response) => {
//             convo.say(txt(replies.acknowledge))
//             convo.switchTo('topping')
//         }

//     },
//     {
//         default: true,
//         callback: () => {
//             convo.say(txt('Please enter your decision'))
//             convo.repeat()
//         }
//     }
// ])


// bp.hear('MENU_SEND_EX_08', (event, next) => {
//   event.reply('#askLocation')
// })

// bp.hear({ type: 'location' }, (event, next) => {
//   event.reply('#askLocation_reply', { coordinates: event.raw.payload.coordinates })
// })