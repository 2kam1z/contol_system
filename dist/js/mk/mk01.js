
var chart = c3.generate({
    data: {
        columns: [
            ['data1',-68,89,-49,-22,29,18,1,-46,84,-4,-91,-83,87,10,44,-28,-39,89,-99,2,-53,-26,87,8,68,79,5,5,64,-11,-12,76,0,22,79,50,-24,-54,-77,40,0,-23,-20,19,66,-74,-100,-99,94,-39,28,0,13,-93,65,-72,43,-14,5,-25,-20,34,15,65,45,6,9],

        ],
        type: 'bar',
        colors: {
            data1: '#5764ec',
            data2: '#00ff00',
            data3: '#0000ff'
        }
        
    },

    axis: {
        x: {
            type: 'category',
            categories: [,1957,1958,1959,1960,1961,1962,1963,1964,1965,1966,1967,1968,1969,1970,1971,1972,1973,1974,1975,1976,1977,1978,1979,1980,1981,1982,1983,1984,1985,1986,1987,1988,1989,1990,1991,1992,1993,1994,1995,1996,1997,1998,1999,2000,2001,2002,2003,2004,2005,2006,2007,2008,2009,2010,2011,2012,2013,2014,2015,2016,2017,2018,2019,2020,2021,2022,2023],
            tick: {
                rotate: -90,
                color: '#bac7db',
                multiline: false,
                culling: {
                    max: 500// the number of tick texts will be adjusted to less than this value
                }
          
            }
        }

        
    
    },

    

    zoom: {
        enabled: true
    },

    color: {
        data1: '#bac7db'
    },

    legend: {
        show: false
    },

    bar: {
        width: {
            ratio: 0.6// this makes bar width 50% of length between ticks
        }
        // or
        //width: 100 // this makes bar width 100px
    }
});





