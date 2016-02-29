'use strict'

var _ = require('lodash')
var Bookshelf = require('bookshelf')
var Knex = require('knex')

let knex = Knex({ // eslint-disable-line new-cap
    client: 'pg',
    connection: 'postgres://scoop:@192.168.37.10:5432/scoop_testdb'
})

let bookshelf = Bookshelf(knex)
bookshelf.plugin('virtuals')


let BaseModel = bookshelf.Model.extend({
    
    // copied from bookshelf
    _toJSON: function(options) {
        var attrs = _.clone(this.attributes)
        if (options && options.shallow) return attrs

        // add relations
        let relations = this.relations
        for (let key in relations) {
            
            let relation = relations[key]
            attrs[key] = relation
        }
        
        // add virtuals -- copied from https://github.com/tgriesser/bookshelf/blob/master/plugins/virtuals.js#L38-L46
        // try to keep parity with the plugin if it changes..
        if (!options || options.virtuals !== false) {
            if ((options && options.virtuals === true) || this.outputVirtuals) {
                attrs = _.extend(attrs, getVirtuals(this))
            }
        }
        
        // add pivots
        if (options && options.omitPivot) return attrs
        if (this.pivot) {
            let pivot = this.pivot.attributes
            for (let key in pivot) {
                attrs['_pivot_' + key] = pivot[key]
            }
        }
        return attrs
    },
    
    // no op for safety, any tooling can use _toJSON
    toJSON: function(options) {
        return {}
    }

})

function getVirtuals(model) {
    var virtuals
    var attrs = {}
    if (virtuals = model.virtuals) {
        for (let virtualName in virtuals) {
            attrs[virtualName] = getVirtual(model, virtualName)
        }
    }
    return attrs
}

function getVirtual(model, virtualName) {
    var virtuals = model.virtuals
    if (_.isObject(virtuals) && virtuals[virtualName]) {
        return virtuals[virtualName].get ? virtuals[virtualName].get.call(model)
        : virtuals[virtualName].call(model)
    }
}


function serializeModel(models) {
    let jsoned = _.map(models, function(model) {
        return model._toJSON()
    })
    return JSON.stringify(jsoned)
}


let Tester = BaseModel.extend()

let Testers = bookshelf.Collection.extend({
    model: Tester
})

let handler = function() {
    let numRows = _.random(1000, 9999)
    let rows = _.map(_.range(0, numRows), function(n) {
        return { 'name': 'Person1', age: n }
    })

    let testers = Testers.forge(rows)
    let set2 = serializeModel(testers.models)
}

handler()
setInterval(handler, 2000)
